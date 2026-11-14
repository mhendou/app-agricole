import { describe, expect, it } from "vitest";
import {
  CODE_ADMIN_DEV,
  CODE_FAMILLE_DEV,
  ConfigAccesManquante,
  configAcces,
  hacherCode,
  verifierCode,
} from "@/lib/auth/codes";
import { DUREE_SESSION_S, creerJeton, lireJeton } from "@/lib/auth/session";
import { DUREE_BLOCAGE_MS, LimiteEssais, MAX_ESSAIS } from "@/lib/auth/bruteforce";

describe("codes", () => {
  it("hache et vérifie sans « $ » dans le format", () => {
    const h = hacherCode("12345");
    expect(h.startsWith("scrypt:")).toBe(true);
    expect(h).not.toContain("$");
    expect(verifierCode("12345", h)).toBe(true);
    expect(verifierCode("12346", h)).toBe(false);
    expect(verifierCode("12345", "n'importe quoi")).toBe(false);
  });
  it("deux hachages du même code diffèrent (sel)", () => {
    expect(hacherCode("12345")).not.toBe(hacherCode("12345"));
  });
  it("codes de développement hors production uniquement", () => {
    const dev = configAcces({ NODE_ENV: "development" } as NodeJS.ProcessEnv);
    expect(verifierCode(CODE_FAMILLE_DEV, dev.familleHash)).toBe(true);
    expect(verifierCode(CODE_ADMIN_DEV, dev.adminHash)).toBe(true);
    expect(() => configAcces({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).toThrow(
      ConfigAccesManquante,
    );
    expect(() =>
      configAcces({ NODE_ENV: "production", ALLOW_DEV_CODES: "1" } as NodeJS.ProcessEnv),
    ).not.toThrow();
  });
  it("la version change quand un code change", () => {
    const base = {
      NODE_ENV: "production",
      SESSION_SECRET: "s",
      FAMILY_CODE_HASH: "a",
      ADMIN_CODE_HASH: "b",
    };
    const v1 = configAcces(base as NodeJS.ProcessEnv).version;
    const v2 = configAcces({ ...base, FAMILY_CODE_HASH: "c" } as NodeJS.ProcessEnv).version;
    expect(v1).not.toBe(v2);
  });
});

describe("session signée", () => {
  it("round-trip du rôle", () => {
    const j = creerJeton("admin", "v1", "secret", 1000);
    expect(lireJeton(j, "v1", "secret", 2000)).toBe("admin");
    expect(lireJeton(creerJeton("famille", "v1", "secret", 1000), "v1", "secret", 2000)).toBe(
      "famille",
    );
  });
  it("refuse signature falsifiée, mauvais secret, autre version, expiration", () => {
    const j = creerJeton("famille", "v1", "secret", 1000);
    const [corps] = j.split(".");
    const faux = Buffer.from(JSON.stringify({ r: "admin", v: "v1", e: 9e9 })).toString("base64url");
    expect(lireJeton(`${faux}.${j.split(".")[1]}`, "v1", "secret", 2000)).toBeNull();
    expect(lireJeton(`${corps}.xxx`, "v1", "secret", 2000)).toBeNull();
    expect(lireJeton(j, "v1", "autre", 2000)).toBeNull();
    expect(lireJeton(j, "v2", "secret", 2000)).toBeNull();
    expect(lireJeton(j, "v1", "secret", 1000 + DUREE_SESSION_S + 1)).toBeNull();
    expect(lireJeton(undefined, "v1", "secret")).toBeNull();
    expect(lireJeton("n'importe quoi", "v1", "secret")).toBeNull();
  });
});

describe("anti-force brute", () => {
  it("bloque après 5 échecs pendant 15 min puis libère", () => {
    let t = 0;
    const l = new LimiteEssais(() => t);
    for (let i = 1; i < MAX_ESSAIS; i++) expect(l.echec("a").bloque).toBe(false);
    expect(l.blocageRestant("a")).toBe(0);
    expect(l.echec("a").bloque).toBe(true);
    expect(l.blocageRestant("a")).toBe(DUREE_BLOCAGE_MS);
    t = DUREE_BLOCAGE_MS - 1;
    expect(l.blocageRestant("a")).toBe(1);
    t = DUREE_BLOCAGE_MS + 1;
    expect(l.blocageRestant("a")).toBe(0);
  });
  it("délai progressif, clés indépendantes, succès remet à zéro", () => {
    const l = new LimiteEssais(() => 0);
    expect(l.echec("a").delaiMs).toBeLessThan(l.echec("a").delaiMs);
    l.echec("b");
    l.succes("a");
    for (let i = 0; i < MAX_ESSAIS - 1; i++) l.echec("a");
    expect(l.blocageRestant("a")).toBe(0);
    expect(l.blocageRestant("b")).toBe(0);
  });
});
