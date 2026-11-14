import { describe, expect, it } from "vitest";
import { SaisieDepenseSchema, SaisieRecolteSchema, SaisieVenteSchema } from "@/lib/saisie";

const vente = {
  date: "2026-10-01",
  client: "X",
  ville: "",
  pays: "",
  litres: 10,
  prix_unitaire: 12,
  devise: "EUR",
  taux_eur_mad: 10.8,
  montant_dh: null,
  statut: "payé",
  mode_encaissement: "",
  note: "",
};

describe("saisie vente", () => {
  it("calcule le montant en DH depuis le prix en euros et le taux, pays par défaut Maroc", () => {
    const v = SaisieVenteSchema.parse(vente);
    expect(v.montant_dh).toBe(1296);
    expect(v.pays).toBe("Maroc");
  });
  it("conserve un montant corrigé à la main", () => {
    expect(SaisieVenteSchema.parse({ ...vente, montant_dh: 1300 }).montant_dh).toBe(1300);
  });
  it("une vente offerte vaut 0 DH ; en DH le taux est ignoré", () => {
    expect(SaisieVenteSchema.parse({ ...vente, statut: "offert" }).montant_dh).toBe(0);
    const dh = SaisieVenteSchema.parse({
      ...vente,
      devise: "MAD",
      prix_unitaire: 100,
      taux_eur_mad: 10.8,
    });
    expect(dh.montant_dh).toBe(1000);
    expect(dh.taux_eur_mad).toBeNull();
  });
  it("exige le taux en euros et refuse un statut inconnu", () => {
    expect(SaisieVenteSchema.safeParse({ ...vente, taux_eur_mad: null }).success).toBe(false);
    expect(SaisieVenteSchema.safeParse({ ...vente, statut: "x" }).success).toBe(false);
  });
});

describe("saisie dépense et récolte", () => {
  it("valide une dépense", () => {
    const base = { date: "2026-01-01", categorie: "Irrigation", montant_dh: 10 };
    expect(SaisieDepenseSchema.safeParse(base).success).toBe(true);
    expect(SaisieDepenseSchema.safeParse({ ...base, categorie: "Inconnue" }).success).toBe(false);
    expect(SaisieDepenseSchema.safeParse({ ...base, montant_dh: -1 }).success).toBe(false);
    expect(SaisieDepenseSchema.safeParse({ ...base, date: "01/01/2026" }).success).toBe(false);
  });
  it("récolte : kg null = donnée perdue, 0 = pas de récolte", () => {
    expect(
      SaisieRecolteSchema.parse({ annee_recolte: 2026, kg_olives: null }).kg_olives,
    ).toBeNull();
    expect(SaisieRecolteSchema.parse({ annee_recolte: 2026, kg_olives: 0 }).kg_olives).toBe(0);
    expect(SaisieRecolteSchema.safeParse({ annee_recolte: 1800, kg_olives: 1 }).success).toBe(
      false,
    );
  });
});
