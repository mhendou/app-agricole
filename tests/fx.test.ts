import { beforeEach, describe, expect, it, vi } from "vitest";
import { eurVersDh, tauxEurMad, viderCacheTaux } from "@/lib/fx";

const ok = (data: unknown) => ({ ok: true, json: async () => data });
const ko = { ok: false, json: async () => ({}) };

beforeEach(() => viderCacheTaux());

describe("tauxEurMad", () => {
  it("utilise Frankfurter en premier", async () => {
    const f = vi.fn().mockResolvedValue(ok({ rates: { MAD: 10.85 } }));
    const r = await tauxEurMad(10.8, { fetch: f });
    expect(r).toMatchObject({ taux: 10.85, source: "frankfurter" });
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("se replie sur open.er-api.com quand Frankfurter ne connaît pas le MAD", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(ko)
      .mockResolvedValueOnce(ok({ result: "success", rates: { MAD: 10.7123456 } }));
    const r = await tauxEurMad(10.8, { fetch: f });
    expect(r).toMatchObject({ taux: 10.7123, source: "open.er-api.com" });
  });

  it("se replie sur le taux de secours si tout échoue (réseau coupé, réponse absurde)", async () => {
    const f = vi
      .fn()
      .mockRejectedValueOnce(new Error("réseau"))
      .mockResolvedValueOnce(ok({ result: "success", rates: { MAD: 0 } }));
    const r = await tauxEurMad(10.8, { fetch: f });
    expect(r).toMatchObject({ taux: 10.8, source: "secours" });
  });

  it("met en cache 12 h (sauf le taux de secours)", async () => {
    let t = 0;
    const f = vi.fn().mockResolvedValue(ok({ rates: { MAD: 10.9 } }));
    await tauxEurMad(10.8, { fetch: f, maintenant: () => t });
    t = 11 * 3600 * 1000;
    await tauxEurMad(10.8, { fetch: f, maintenant: () => t });
    expect(f).toHaveBeenCalledTimes(1);
    t = 13 * 3600 * 1000;
    await tauxEurMad(10.8, { fetch: f, maintenant: () => t });
    expect(f).toHaveBeenCalledTimes(2);

    viderCacheTaux();
    const g = vi.fn().mockResolvedValue(ko);
    await tauxEurMad(10.8, { fetch: g });
    await tauxEurMad(10.8, { fetch: g });
    expect(g).toHaveBeenCalledTimes(4); // 2 appels par tentative, jamais mis en cache
  });
});

describe("eurVersDh", () => {
  it("arrondit au dirham", () => {
    expect(eurVersDh(12 * 10, 10.8)).toBe(1296);
    expect(eurVersDh(12.5, 10.77)).toBe(135);
  });
});
