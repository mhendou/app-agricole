import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { MockDataSource } from "@/lib/data/mock";
import { decouperParAnnee, prevision7j, recupererHistorique, urlHistorique } from "@/lib/meteo";
import { majPluieRecente, rattraperPluie } from "@/lib/pluie-service";
import { GET } from "@/app/api/cron/pluie/route";

const reponse = (data: unknown) => ({ ok: true, status: 200, json: async () => data });

const archive = (debut: string, jours: number, nul = 0) => {
  const time = Array.from({ length: jours }, (_, i) => {
    const t = new Date(Date.parse(debut) + i * 86400000);
    return t.toISOString().slice(0, 10);
  });
  return {
    daily: {
      time,
      precipitation_sum: time.map((_, i) => (i >= jours - nul ? null : i % 2 ? 1.234 : 0)),
      temperature_2m_max: time.map(() => 20.04),
      temperature_2m_min: time.map(() => 5.06),
    },
  };
};

let dir: string;
let ds: MockDataSource;
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "meteo-"));
  ds = new MockDataSource(dir, path.join(process.cwd(), "data"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
  delete process.env.CRON_SECRET;
});

describe("recupererHistorique", () => {
  it("construit l'URL de l'archive et ignore les jours sans valeur", async () => {
    const f = vi.fn().mockResolvedValue(reponse(archive("2026-01-01", 5, 2)));
    const l = await recupererHistorique(32.21, -6.54, "2026-01-01", "2026-01-05", f);
    expect(f.mock.calls[0][0]).toContain("archive-api.open-meteo.com/v1/archive");
    expect(f.mock.calls[0][0]).toContain("start_date=2026-01-01");
    expect(l).toHaveLength(3);
    expect(l[1]).toMatchObject({
      date: "2026-01-02",
      pluie_mm: 1.2,
      temp_max: 20,
      temp_min: 5.1,
      source: "open-meteo",
    });
  });
  it("signale une erreur HTTP", async () => {
    const f = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    await expect(recupererHistorique(1, 1, "2026-01-01", "2026-01-02", f)).rejects.toThrow(/500/);
  });
  it("découpe par année", () => {
    expect(decouperParAnnee("2024-06-01", "2026-02-10")).toEqual([
      { debut: "2024-06-01", fin: "2024-12-31" },
      { debut: "2025-01-01", fin: "2025-12-31" },
      { debut: "2026-01-01", fin: "2026-02-10" },
    ]);
    expect(urlHistorique(1, 2, "a", "b")).toContain("timezone=Africa%2FCasablanca");
  });
});

describe("prevision7j", () => {
  it("lit 7 jours et met en cache 1 h", async () => {
    const d = {
      daily: {
        time: ["2026-11-15", "2026-11-16"],
        precipitation_sum: [0, 3.46],
        precipitation_probability_max: [10, 80],
        temperature_2m_max: [22, 19],
        temperature_2m_min: [8, 7],
      },
    };
    const f = vi.fn().mockResolvedValue(reponse(d));
    const t = 0;
    const a = await prevision7j(33.1, -6.1, f, () => t);
    await prevision7j(33.1, -6.1, f, () => t + 1000);
    expect(f).toHaveBeenCalledTimes(1);
    expect(a[1]).toMatchObject({ pluie_mm: 3.5, probabilite: 80 });
  });
});

describe("mises à jour de la pluie", () => {
  it("le cron ajoute sans doublon (2 passages = mêmes lignes)", async () => {
    const f = vi.fn().mockImplementation(async (url: string) => {
      const debut = /start_date=([\d-]+)/.exec(url)![1];
      return reponse(archive(debut, 10));
    });
    const now = new Date("2026-11-14T12:00:00Z");
    const a = await majPluieRecente(ds, 10, f, now);
    const b = await majPluieRecente(ds, 10, f, now);
    expect(a.ajoutes).toBe(10);
    expect(b.ajoutes).toBe(0);
    expect((await ds.lireTout()).pluie).toHaveLength(10);
  });
  it("le rattrapage parcourt chaque année", async () => {
    const f = vi.fn().mockImplementation(async (url: string) => {
      const debut = /start_date=([\d-]+)/.exec(url)![1];
      const fin = /end_date=([\d-]+)/.exec(url)![1];
      const n = Math.round((Date.parse(fin) - Date.parse(debut)) / 86400000) + 1;
      return reponse(archive(debut, n));
    });
    const r = await rattraperPluie(ds, "2024-01-01", f, new Date("2026-01-10T12:00:00Z"));
    expect(f).toHaveBeenCalledTimes(3);
    expect(r.ajoutes).toBe(366 + 365 + 9);
  });
});

describe("route cron", () => {
  it("refuse sans secret ou avec un mauvais secret, même si CRON_SECRET n'est pas défini", async () => {
    expect((await GET(new Request("http://x/api/cron/pluie"))).status).toBe(401);
    process.env.CRON_SECRET = "abc";
    expect((await GET(new Request("http://x/api/cron/pluie"))).status).toBe(401);
    const mauvais = new Request("http://x/api/cron/pluie", {
      headers: { authorization: "Bearer zzz" },
    });
    expect((await GET(mauvais)).status).toBe(401);
  });
});
