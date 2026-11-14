import { z } from "zod";
import { CATEGORIES, DEVISES, MODES_PAIEMENT, STATUTS } from "./types";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");
const texte = z.string().trim().max(300, "Texte trop long.").default("");
const nombre = (nom: string) =>
  z.number({ error: `${nom} : nombre attendu.` }).finite(`${nom} : nombre attendu.`);

export const SaisieDepenseSchema = z.object({
  date,
  categorie: z.enum(CATEGORIES, { error: "Choisissez une catégorie." }),
  description: texte,
  beneficiaire: texte,
  montant_dh: nombre("Montant").min(0, "Le montant ne peut pas être négatif."),
  mode_paiement: z
    .enum([...MODES_PAIEMENT, ""], { error: "Mode de paiement invalide." })
    .default(""),
  note: texte,
});
export type SaisieDepense = z.infer<typeof SaisieDepenseSchema>;

export const SaisieVenteSchema = z
  .object({
    date,
    client: texte,
    ville: texte,
    pays: texte.transform((p) => p || "Maroc"),
    litres: nombre("Litres").min(0, "Les litres ne peuvent pas être négatifs."),
    prix_unitaire: nombre("Prix").min(0, "Le prix ne peut pas être négatif."),
    devise: z.enum(DEVISES, { error: "Devise invalide." }),
    taux_eur_mad: nombre("Taux").positive("Le taux doit être positif.").nullable().default(null),
    /** Vide : calculé à partir des litres, du prix et du taux. */
    montant_dh: nombre("Montant")
      .min(0, "Le montant ne peut pas être négatif.")
      .nullable()
      .default(null),
    statut: z.enum(STATUTS, { error: "Choisissez un statut." }),
    mode_encaissement: z.enum([...MODES_PAIEMENT, ""], { error: "Mode invalide." }).default(""),
    note: texte,
  })
  .superRefine((v, ctx) => {
    if (v.devise === "EUR" && (v.taux_eur_mad === null || v.taux_eur_mad <= 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["taux_eur_mad"],
        message: "Indiquez le taux EUR → DH.",
      });
    }
  })
  .transform((v) => {
    const calcule =
      v.statut === "offert"
        ? 0
        : Math.round(v.litres * v.prix_unitaire * (v.devise === "EUR" ? (v.taux_eur_mad ?? 1) : 1));
    return {
      ...v,
      taux_eur_mad: v.devise === "EUR" ? v.taux_eur_mad : null,
      montant_dh: v.montant_dh ?? calcule,
    };
  });
export type SaisieVente = z.input<typeof SaisieVenteSchema>;

export const SaisieRecolteSchema = z.object({
  annee_recolte: z
    .number({ error: "Année invalide." })
    .int("Année invalide.")
    .min(1990, "Année invalide.")
    .max(2100, "Année invalide."),
  kg_olives: nombre("Kilos").min(0, "Les kilos ne peuvent pas être négatifs.").nullable(),
  litres_huile: nombre("Litres")
    .min(0, "Les litres ne peuvent pas être négatifs.")
    .nullable()
    .default(null),
  date_recolte: date.nullable().default(null),
  note: texte,
});

export function messageErreur(e: unknown): string {
  if (e instanceof z.ZodError) return e.issues.map((i) => i.message).join(" ");
  return "Requête invalide.";
}
