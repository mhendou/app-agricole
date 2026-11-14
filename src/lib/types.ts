import { z } from "zod";

export const CATEGORIES = [
  "Irrigation",
  "Facture d'eau",
  "Main-d'œuvre",
  "Engrais & intrants",
  "Récolte & moulin",
  "Conditionnement",
  "Gardiennage & animaux",
  "Matériel & entretien",
  "Autre",
] as const;
export const MODES_PAIEMENT = ["virement", "cash"] as const;
export const DEVISES = ["MAD", "EUR"] as const;
export const STATUTS = ["payé", "à encaisser", "offert"] as const;

const dateIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date invalide (AAAA-MM-JJ attendu)");

export const DepenseSchema = z.object({
  id: z.string().min(1),
  date: dateIso,
  categorie: z.string().min(1, "catégorie manquante"),
  description: z.string().default(""),
  beneficiaire: z.string().default(""),
  montant_dh: z.number().finite().min(0, "montant négatif"),
  mode_paiement: z.string().default(""),
  note: z.string().default(""),
});
export type Depense = z.infer<typeof DepenseSchema>;

export const VenteSchema = z.object({
  id: z.string().min(1),
  date: dateIso,
  client: z.string().default(""),
  ville: z.string().default(""),
  pays: z.string().default("Maroc"),
  litres: z.number().finite().min(0),
  prix_unitaire: z.number().finite().min(0),
  devise: z.enum(DEVISES),
  taux_eur_mad: z.number().finite().positive().nullable(),
  montant_dh: z.number().finite().min(0),
  statut: z.enum(STATUTS),
  mode_encaissement: z.string().default(""),
  note: z.string().default(""),
});
export type Vente = z.infer<typeof VenteSchema>;

export const RecolteSchema = z.object({
  annee_recolte: z.number().int().min(1900).max(2200),
  kg_olives: z.number().finite().min(0).nullable(),
  litres_huile: z.number().finite().min(0).nullable(),
  date_recolte: dateIso.nullable(),
  note: z.string().default(""),
});
export type Recolte = z.infer<typeof RecolteSchema>;

export const PluieSchema = z.object({
  date: dateIso,
  pluie_mm: z.number().finite().min(0).nullable(),
  temp_max: z.number().finite().nullable(),
  temp_min: z.number().finite().nullable(),
  source: z.string().default(""),
  pluie_mm_mesuree: z.number().finite().min(0).nullable(),
});
export type Pluie = z.infer<typeof PluieSchema>;

export type Parametres = {
  nb_oliviers: number;
  latitude: number;
  longitude: number;
  nom_exploitation: string;
  lien_meteoblue: string;
  taux_secours_eur_mad: number;
};

export const PARAMETRES_DEFAUT: Parametres = {
  nb_oliviers: 38,
  latitude: 32.21,
  longitude: -6.54,
  nom_exploitation: "Oliveraie d'Afourer",
  lien_meteoblue: "https://www.meteoblue.com/fr/meteo/semaine/afourer_maroc",
  taux_secours_eur_mad: 10.8,
};

/** Une ligne ignorée à la lecture, listée dans « Contrôle des données ». */
export type LigneInvalide = {
  onglet: TableNom;
  ligne: number; // numéro de ligne dans le tableau (en-tête = 1)
  message: string;
};

export type TableNom = "Depenses" | "Ventes" | "Recoltes" | "Pluie" | "Parametres";

export type Donnees = {
  depenses: Depense[];
  ventes: Vente[];
  recoltes: Recolte[];
  pluie: Pluie[];
  parametres: Parametres;
  invalides: LigneInvalide[];
  /** ISO de la dernière lecture des données. */
  lu_le: string;
};
