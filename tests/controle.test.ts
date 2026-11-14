import { beforeAll, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { controlerDonnees, lienSheet } from "@/lib/controle";
import { MockDataSource } from "@/lib/data/mock";
import type { Donnees } from "@/lib/types";

let d: Donnees;
beforeAll(async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ctrl-"));
  d = await new MockDataSource(dir, path.join(process.cwd(), "data")).lireTout();
});

describe("contrôle des données", () => {
  it("repère les notes « à vérifier » des données de départ", () => {
    const c = controlerDonnees(d);
    expect(c.aVerifier.length).toBeGreaterThanOrEqual(3);
    expect(c.aVerifier.some((a) => a.onglet === "Ventes")).toBe(true);
    expect(c.aVerifier.some((a) => a.onglet === "Depenses")).toBe(true);
  });
  it("repère un montant différent de litres × prix et un doublon", () => {
    const v = {
      ...d.ventes[0],
      id: "V900",
      litres: 10,
      prix_unitaire: 100,
      montant_dh: 900,
      statut: "payé" as const,
      devise: "MAD" as const,
      taux_eur_mad: null,
    };
    const dep = { ...d.depenses[0], id: "D900" };
    const c = controlerDonnees({ ...d, ventes: [...d.ventes, v], depenses: [...d.depenses, dep] });
    expect(c.incoherences.some((a) => a.id === "V900")).toBe(true);
    expect(c.doublons.some((a) => a.id === "D900")).toBe(true);
  });
  it("liste les lignes invalides et compte le total", () => {
    const c = controlerDonnees({ ...d, invalides: [{ onglet: "Ventes", ligne: 5, message: "x" }] });
    expect(c.invalides).toHaveLength(1);
    expect(c.total).toBe(
      c.invalides.length + c.aVerifier.length + c.incoherences.length + c.doublons.length,
    );
  });
  it("lien du Sheet", () => {
    expect(lienSheet({ SHEET_ID: "abc" } as unknown as NodeJS.ProcessEnv)).toBe(
      "https://docs.google.com/spreadsheets/d/abc/edit",
    );
    expect(lienSheet({} as NodeJS.ProcessEnv)).toBeNull();
  });
});
