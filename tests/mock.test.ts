import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { MockDataSource } from "@/lib/data/mock";
import { parseCsv } from "@/lib/data/csv";
import { DonneeIntrouvable, fusionnerPluie, prochainId } from "@/lib/data/source";

let dir: string;
let ds: MockDataSource;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "mock-"));
  ds = new MockDataSource(dir, path.join(process.cwd(), "data"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

describe("csv", () => {
  it("gère les guillemets et les virgules", () => {
    expect(parseCsv('a,b\n"x, y","il dit ""oui"""\n')).toEqual([
      ["a", "b"],
      ["x, y", 'il dit "oui"'],
    ]);
  });
});

describe("MockDataSource", () => {
  it("s'initialise depuis les CSV", async () => {
    const d = await ds.lireTout();
    expect(d.depenses).toHaveLength(9);
    expect(d.depenses[0].id).toBe("D001");
    expect(d.ventes).toHaveLength(22);
    expect(d.ventes[21].id).toBe("V022");
    expect(d.recoltes).toHaveLength(13);
    expect(d.parametres.nb_oliviers).toBe(38);
  });

  it("ajoute, modifie, supprime une dépense par id", async () => {
    const base = {
      date: "2026-07-01",
      categorie: "Irrigation",
      description: "x",
      beneficiaire: "",
      montant_dh: 100,
      mode_paiement: "cash",
      note: "",
    };
    const a = await ds.ajouterDepense(base);
    expect(a.id).toBe("D010");
    const m = await ds.modifierDepense("D010", { ...base, montant_dh: 250 });
    expect(m.montant_dh).toBe(250);
    expect((await ds.lireTout()).depenses.find((x) => x.id === "D010")?.montant_dh).toBe(250);
    await ds.supprimerDepense("D010");
    expect((await ds.lireTout()).depenses).toHaveLength(9);
    await expect(ds.supprimerDepense("D010")).rejects.toBeInstanceOf(DonneeIntrouvable);
    await expect(ds.modifierDepense("D999", base)).rejects.toBeInstanceOf(DonneeIntrouvable);
  });

  it("ajoute et supprime une vente", async () => {
    const v = await ds.ajouterVente({
      date: "2026-08-01",
      client: "Test",
      ville: "",
      pays: "Maroc",
      litres: 2,
      prix_unitaire: 100,
      devise: "MAD",
      taux_eur_mad: null,
      montant_dh: 200,
      statut: "payé",
      mode_encaissement: "",
      note: "",
    });
    expect(v.id).toBe("V023");
    await ds.supprimerVente("V023");
    expect((await ds.lireTout()).ventes).toHaveLength(22);
  });

  it("remplace la récolte d'une année et la supprime", async () => {
    await ds.enregistrerRecolte({
      annee_recolte: 2026,
      kg_olives: 1000,
      litres_huile: 180,
      date_recolte: null,
      note: "",
    });
    await ds.enregistrerRecolte({
      annee_recolte: 2026,
      kg_olives: 1200,
      litres_huile: null,
      date_recolte: null,
      note: "",
    });
    const r = (await ds.lireTout()).recoltes.filter((x) => x.annee_recolte === 2026);
    expect(r).toHaveLength(1);
    expect(r[0].kg_olives).toBe(1200);
    await ds.supprimerRecolte(2026);
    expect((await ds.lireTout()).recoltes).toHaveLength(13);
  });

  it("ajoute la pluie sans doublon et garde le relevé mesuré", async () => {
    const j = (date: string, mm: number, mes: number | null = null) => ({
      date,
      pluie_mm: mm,
      temp_max: null,
      temp_min: null,
      source: "open-meteo",
      pluie_mm_mesuree: mes,
    });
    expect(await ds.ajouterPluie([j("2026-01-01", 2, 3), j("2026-01-02", 1)])).toBe(2);
    expect(await ds.ajouterPluie([j("2026-01-01", 5), j("2026-01-03", 0)])).toBe(1);
    const p = (await ds.lireTout()).pluie;
    expect(p.map((x) => x.date)).toEqual(["2026-01-01", "2026-01-02", "2026-01-03"]);
    expect(p[0]).toMatchObject({ pluie_mm: 5, pluie_mm_mesuree: 3 });
  });
});

describe("utilitaires", () => {
  it("prochainId", () => {
    expect(prochainId("D", [])).toBe("D001");
    expect(prochainId("D", ["D009", "D002", "X5"])).toBe("D010");
  });
  it("fusionnerPluie trie par date", () => {
    const p = (date: string) => ({
      date,
      pluie_mm: 1,
      temp_max: null,
      temp_min: null,
      source: "",
      pluie_mm_mesuree: null,
    });
    expect(fusionnerPluie([p("2026-02-01")], [p("2026-01-01")]).lignes.map((x) => x.date)).toEqual([
      "2026-01-01",
      "2026-02-01",
    ]);
  });
});
