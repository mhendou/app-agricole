import { describe, expect, it } from "vitest";
import {
  dateDepuisSerie,
  parseDate,
  parseDepenses,
  parseNombre,
  parseParametres,
  parsePluie,
  parseRecoltes,
  parseVentes,
  pluieRetenue,
} from "@/lib/parse";

describe("parseNombre", () => {
  it("gère la virgule décimale, espaces et unités", () => {
    expect(parseNombre("1 234,5")).toBe(1234.5);
    expect(parseNombre("910 DH")).toBe(910);
    expect(parseNombre("1.234,56")).toBe(1234.56);
    expect(parseNombre("1,234.56")).toBe(1234.56);
    expect(parseNombre(12)).toBe(12);
    expect(parseNombre("")).toBeNull();
    expect(parseNombre(undefined)).toBeNull();
    expect(parseNombre("abc")).toBeNaN();
  });
});

describe("parseDate", () => {
  it("gère texte ISO, JJ/MM/AAAA, texte français et numéro de série", () => {
    expect(parseDate("2026-04-13")).toBe("2026-04-13");
    expect(parseDate("13/04/2026")).toBe("2026-04-13");
    expect(parseDate("13 avr. 2026")).toBe("2026-04-13");
    expect(parseDate(46125)).toBe("2026-04-13");
    expect(dateDepuisSerie(1)).toBe("1899-12-31");
    expect(parseDate("31/02/2026")).toBeNull();
    expect(parseDate("n'importe quoi")).toBeNull();
    expect(parseDate("")).toBeNull();
  });
});

describe("parseDepenses", () => {
  it("retrouve les colonnes par nom, dans le désordre, et ignore les lignes vides", () => {
    const r = parseDepenses([
      ["montant_dh", "id", "Date", "categorie", "description", "colonne_en_plus"],
      ["910", "D001", 46125, "Irrigation", "Irrigation", "x"],
      ["", "", "", "", "", ""],
      ["1 800,50", "D002", "2026-06-01", "Main-d'œuvre", "Aicha", ""],
    ]);
    expect(r.invalides).toEqual([]);
    expect(r.lignes).toHaveLength(2);
    expect(r.lignes[0]).toMatchObject({ id: "D001", date: "2026-04-13", montant_dh: 910 });
    expect(r.lignes[1].montant_dh).toBe(1800.5);
  });
  it("ignore et liste une ligne invalide sans planter", () => {
    const r = parseDepenses([
      ["id", "date", "categorie", "montant_dh"],
      ["D1", "pas une date", "Irrigation", "10"],
      ["D2", "2026-01-02", "Irrigation", "dix"],
      ["D3", "2026-01-02", "", "10"],
      ["D4", "2026-01-02", "Irrigation", "10"],
    ]);
    expect(r.lignes.map((l) => l.id)).toEqual(["D4"]);
    expect(r.invalides.map((i) => i.ligne)).toEqual([2, 3, 4]);
  });
});

describe("parseVentes", () => {
  it("accepte statut sans accent et calcule un montant manquant", () => {
    const r = parseVentes([
      ["id", "date", "litres", "prix_unitaire", "devise", "taux_eur_mad", "montant_dh", "statut"],
      ["V1", "2026-03-15", "30", "70", "MAD", "", "", "paye"],
      ["V2", "2026-03-16", "10", "12", "EUR", "10,8", "", "à encaisser"],
      ["V3", "2026-03-17", "5", "", "MAD", "", "", "offert"],
    ]);
    expect(r.invalides).toEqual([]);
    expect(r.lignes[0]).toMatchObject({ statut: "payé", montant_dh: 2100 });
    expect(r.lignes[1].montant_dh).toBe(1296);
    expect(r.lignes[2]).toMatchObject({ statut: "offert", montant_dh: 0 });
  });
  it("rejette un statut inconnu et une vente EUR sans taux", () => {
    const r = parseVentes([
      ["id", "date", "litres", "prix_unitaire", "devise", "montant_dh", "statut"],
      ["V1", "2026-03-15", "30", "70", "MAD", "100", "bizarre"],
      ["V2", "2026-03-15", "30", "12", "EUR", "", "payé"],
    ]);
    expect(r.lignes).toEqual([]);
    expect(r.invalides).toHaveLength(2);
  });
});

describe("parseRecoltes", () => {
  it("distingue donnée perdue (vide) et 0 kg", () => {
    const r = parseRecoltes([
      ["annee_recolte", "kg_olives", "litres_huile", "date_recolte", "note"],
      [2015, "", "", "", "donnée perdue"],
      [2020, 0, "", "", ""],
      [2025, "3 929", 711, "", ""],
    ]);
    expect(r.lignes.map((l) => l.kg_olives)).toEqual([null, 0, 3929]);
    expect(r.lignes[2].litres_huile).toBe(711);
  });
});

describe("parsePluie et parametres", () => {
  it("le relevé mesuré prime", () => {
    const r = parsePluie([
      ["date", "pluie_mm", "temp_max", "temp_min", "source", "pluie_mm_mesuree"],
      ["2026-01-01", "2,5", 18, 5, "open-meteo", "4"],
      ["2026-01-02", "1", "", "", "open-meteo", ""],
    ]);
    expect(r.lignes.map(pluieRetenue)).toEqual([4, 1]);
  });
  it("lit les paramètres avec valeurs par défaut", () => {
    const p = parseParametres([
      ["cle", "valeur"],
      ["nb_oliviers", "40"],
      ["latitude", "32,3"],
      ["nom_exploitation", "Ma ferme"],
    ]);
    expect(p.nb_oliviers).toBe(40);
    expect(p.latitude).toBe(32.3);
    expect(p.nom_exploitation).toBe("Ma ferme");
    expect(p.longitude).toBe(-6.54);
  });
});
