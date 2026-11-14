import { describe, expect, it, vi } from "vitest";
import type { Cellule } from "@/lib/parse";
import { SheetsDataSource, ligneDepuisEntetes } from "@/lib/data/sheets";
import { creerClientGoogle, proteger, type SheetsClient } from "@/lib/data/sheets-client";
import { DonneeIntrouvable } from "@/lib/data/source";

/** Faux client Sheets en mémoire (aucun appel réseau). */
function fauxClient(init: Record<string, Cellule[][]>) {
  const tables: Record<string, Cellule[][]> = JSON.parse(JSON.stringify(init));
  const appels = { lectures: 0 };
  const client: SheetsClient = {
    async lireOnglets(noms) {
      appels.lectures++;
      return noms.map((n) => JSON.parse(JSON.stringify(tables[n] ?? [])));
    },
    async ajouterLignes(o, l) {
      (tables[o] ??= []).push(...l);
    },
    async ecrireLignes(maj) {
      for (const m of maj) tables[m.onglet][m.ligne - 1] = m.valeurs;
    },
    async supprimerLigne(o, n) {
      tables[o].splice(n - 1, 1);
    },
  };
  return { client, tables, appels };
}

const baseTables = (): Record<string, Cellule[][]> => ({
  Depenses: [
    [
      "montant_dh",
      "id",
      "date",
      "categorie",
      "description",
      "beneficiaire",
      "mode_paiement",
      "note",
      "colonne_perso",
    ],
    [910, "D001", 46125, "Irrigation", "Irrigation", "R", "virement", "", "garder"],
    [520, "D002", 46139, "Main-d'œuvre", "Jardinage", "R", "virement", "", "aussi"],
  ],
  Ventes: [
    ["id", "date", "litres", "prix_unitaire", "devise", "taux_eur_mad", "montant_dh", "statut"],
  ],
  Recoltes: [
    ["annee_recolte", "kg_olives", "litres_huile", "date_recolte", "note"],
    [2024, 215, "", "", ""],
  ],
  Pluie: [["date", "pluie_mm", "temp_max", "temp_min", "source", "pluie_mm_mesuree"]],
  Parametres: [
    ["cle", "valeur"],
    ["nb_oliviers", 38],
  ],
});

const nouvelleDepense = {
  date: "2026-07-01",
  categorie: "Irrigation",
  description: "test",
  beneficiaire: "",
  montant_dh: 100,
  mode_paiement: "cash",
  note: "",
};

describe("SheetsDataSource", () => {
  it("lit toutes les données en retrouvant les colonnes par nom", async () => {
    const { client } = fauxClient(baseTables());
    const d = await new SheetsDataSource(client).lireTout();
    expect(d.depenses.map((x) => [x.id, x.montant_dh, x.date])).toEqual([
      ["D001", 910, "2026-04-13"],
      ["D002", 520, "2026-04-27"],
    ]);
    expect(d.recoltes[0].kg_olives).toBe(215);
    expect(d.parametres.nb_oliviers).toBe(38);
  });

  it("met en cache 60 s puis relit", async () => {
    const { client, appels } = fauxClient(baseTables());
    let t = 0;
    const ds = new SheetsDataSource(client, () => t);
    await ds.lireTout();
    t = 30_000;
    await ds.lireTout();
    expect(appels.lectures).toBe(1);
    t = 61_000;
    await ds.lireTout();
    expect(appels.lectures).toBe(2);
  });

  it("une écriture invalide le cache", async () => {
    const { client } = fauxClient(baseTables());
    const ds = new SheetsDataSource(client, () => 0);
    await ds.lireTout();
    await ds.ajouterDepense(nouvelleDepense);
    expect((await ds.lireTout()).depenses).toHaveLength(3);
  });

  it("ajoute une dépense dans l'ordre des en-têtes réels, avec le prochain id", async () => {
    const { client, tables } = fauxClient(baseTables());
    const d = await new SheetsDataSource(client).ajouterDepense(nouvelleDepense);
    expect(d.id).toBe("D003");
    expect(tables.Depenses[3]).toEqual([
      100,
      "D003",
      "2026-07-01",
      "Irrigation",
      "test",
      "",
      "cash",
      "",
      "",
    ]);
  });

  it("modifie par id en conservant les colonnes inconnues", async () => {
    const { client, tables } = fauxClient(baseTables());
    await new SheetsDataSource(client).modifierDepense("D002", {
      ...nouvelleDepense,
      montant_dh: 999,
    });
    expect(tables.Depenses[2][0]).toBe(999);
    expect(tables.Depenses[2][8]).toBe("aussi");
    expect(tables.Depenses[1][0]).toBe(910);
  });

  it("supprime par id et signale un id inconnu", async () => {
    const { client, tables } = fauxClient(baseTables());
    const ds = new SheetsDataSource(client);
    await ds.supprimerDepense("D001");
    expect(tables.Depenses).toHaveLength(2);
    await expect(ds.supprimerDepense("D404")).rejects.toBeInstanceOf(DonneeIntrouvable);
    await expect(ds.modifierDepense("D404", nouvelleDepense)).rejects.toBeInstanceOf(
      DonneeIntrouvable,
    );
  });

  it("enregistre une récolte (ajout puis remplacement)", async () => {
    const { client, tables } = fauxClient(baseTables());
    const ds = new SheetsDataSource(client);
    const r = {
      annee_recolte: 2025,
      kg_olives: 3929,
      litres_huile: 711,
      date_recolte: "2026-01-15",
      note: "",
    };
    await ds.enregistrerRecolte(r);
    await ds.enregistrerRecolte({ ...r, kg_olives: 4000 });
    expect(tables.Recoltes).toHaveLength(3);
    expect(tables.Recoltes[2][1]).toBe(4000);
    await ds.supprimerRecolte(2025);
    expect(tables.Recoltes).toHaveLength(2);
  });

  it("ajoute la pluie sans doublon", async () => {
    const { client, tables } = fauxClient(baseTables());
    const ds = new SheetsDataSource(client);
    const j = (date: string, mm: number) => ({
      date,
      pluie_mm: mm,
      temp_max: 20,
      temp_min: 5,
      source: "open-meteo",
      pluie_mm_mesuree: null,
    });
    expect(await ds.ajouterPluie([j("2026-01-01", 1), j("2026-01-02", 2)])).toBe(2);
    expect(await ds.ajouterPluie([j("2026-01-02", 2), j("2026-01-03", 0)])).toBe(1);
    expect(tables.Pluie).toHaveLength(4);
  });

  it("ignore les lignes invalides sans planter", async () => {
    const t = baseTables();
    t.Depenses.push(["x", "D009", "pas une date", "Irrigation", "", "", "", "", ""]);
    const { client } = fauxClient(t);
    const d = await new SheetsDataSource(client).lireTout();
    expect(d.depenses).toHaveLength(2);
    expect(d.invalides).toHaveLength(1);
    expect(d.invalides[0]).toMatchObject({ onglet: "Depenses", ligne: 4 });
  });
});

describe("outils", () => {
  it("ligneDepuisEntetes", () => {
    expect(ligneDepuisEntetes(["B", "a", "Zzz"], { a: 1, b: 2 }, ["x", "y", "z"])).toEqual([
      2,
      1,
      "z",
    ]);
  });
  it("proteger neutralise les formules mais pas les nombres", () => {
    expect(proteger("=SOMME(A1)")).toBe("'=SOMME(A1)");
    expect(proteger("-12")).toBe("-12");
    expect(proteger(null)).toBe("");
  });
});

describe("creerClientGoogle (googleapis simulé)", () => {
  it("lit via batchGet UNFORMATTED_VALUE et écrit via append / batchUpdate", async () => {
    const batchGet = vi
      .fn()
      .mockResolvedValue({ data: { valueRanges: [{ values: [["a"]] }, {}] } });
    const append = vi.fn().mockResolvedValue({});
    const valuesBatchUpdate = vi.fn().mockResolvedValue({});
    const get = vi
      .fn()
      .mockResolvedValue({ data: { sheets: [{ properties: { title: "Ventes", sheetId: 7 } }] } });
    const batchUpdate = vi.fn().mockResolvedValue({});
    const faux = {
      spreadsheets: {
        get,
        batchUpdate,
        values: { batchGet, append, batchUpdate: valuesBatchUpdate },
      },
    } as never;
    const c = creerClientGoogle(faux, "SHEET");
    expect(await c.lireOnglets(["Depenses", "Ventes"])).toEqual([[["a"]], []]);
    expect(batchGet.mock.calls[0][0]).toMatchObject({
      spreadsheetId: "SHEET",
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    await c.ajouterLignes("Ventes", [["=x", 1]]);
    expect(append.mock.calls[0][0].requestBody.values).toEqual([["'=x", 1]]);
    await c.ecrireLignes([{ onglet: "Ventes", ligne: 5, valeurs: ["a"] }]);
    expect(valuesBatchUpdate.mock.calls[0][0].requestBody.data[0].range).toBe("'Ventes'!A5");
    await c.supprimerLigne("Ventes", 5);
    expect(
      batchUpdate.mock.calls[0][0].requestBody.requests[0].deleteDimension.range,
    ).toMatchObject({ sheetId: 7, startIndex: 4, endIndex: 5 });
    await expect(c.supprimerLigne("Inconnu", 2)).rejects.toThrow(/introuvable/);
  });
});
