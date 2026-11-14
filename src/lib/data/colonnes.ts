import { CATEGORIES, DEVISES, MODES_PAIEMENT, STATUTS, type TableNom } from "../types";

/** En-têtes attendus de chaque onglet (ordre de création ; la lecture, elle, se fait par nom). */
export const COLONNES: Record<TableNom, readonly string[]> = {
  Depenses: [
    "id",
    "date",
    "categorie",
    "description",
    "beneficiaire",
    "montant_dh",
    "mode_paiement",
    "note",
  ],
  Ventes: [
    "id",
    "date",
    "client",
    "ville",
    "pays",
    "litres",
    "prix_unitaire",
    "devise",
    "taux_eur_mad",
    "montant_dh",
    "statut",
    "mode_encaissement",
    "note",
  ],
  Recoltes: ["annee_recolte", "kg_olives", "litres_huile", "date_recolte", "note"],
  Pluie: ["date", "pluie_mm", "temp_max", "temp_min", "source", "pluie_mm_mesuree"],
  Parametres: ["cle", "valeur"],
};

/** Listes déroulantes (onglet → colonne → valeurs). */
export const LISTES: Partial<Record<TableNom, Record<string, readonly string[]>>> = {
  Depenses: { categorie: CATEGORIES, mode_paiement: MODES_PAIEMENT },
  Ventes: { devise: DEVISES, statut: STATUTS, mode_encaissement: MODES_PAIEMENT },
};

export const COLONNES_DATE: Partial<Record<TableNom, readonly string[]>> = {
  Depenses: ["date"],
  Ventes: ["date"],
  Recoltes: ["date_recolte"],
  Pluie: ["date"],
};

export const COLONNES_NOMBRE: Partial<Record<TableNom, readonly string[]>> = {
  Depenses: ["montant_dh"],
  Ventes: ["litres", "prix_unitaire", "taux_eur_mad", "montant_dh"],
  Recoltes: ["annee_recolte", "kg_olives", "litres_huile"],
  Pluie: ["pluie_mm", "temp_max", "temp_min", "pluie_mm_mesuree"],
};

export const ONGLETS: TableNom[] = ["Depenses", "Ventes", "Recoltes", "Pluie", "Parametres"];
