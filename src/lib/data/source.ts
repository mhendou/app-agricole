import type { Depense, Donnees, Pluie, Recolte, Vente } from "../types";

export type NouvelleDepense = Omit<Depense, "id">;
export type NouvelleVente = Omit<Vente, "id">;

export class DonneeIntrouvable extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DonneeIntrouvable";
  }
}

/** Interface unique d'accès aux données (mock local ou Google Sheets). */
export interface DataSource {
  lireTout(): Promise<Donnees>;

  ajouterDepense(d: NouvelleDepense): Promise<Depense>;
  modifierDepense(id: string, d: NouvelleDepense): Promise<Depense>;
  supprimerDepense(id: string): Promise<void>;

  ajouterVente(v: NouvelleVente): Promise<Vente>;
  modifierVente(id: string, v: NouvelleVente): Promise<Vente>;
  supprimerVente(id: string): Promise<void>;

  /** Ajoute ou remplace la récolte de l'année. */
  enregistrerRecolte(r: Recolte): Promise<Recolte>;
  supprimerRecolte(annee: number): Promise<void>;

  /** Ajoute des jours de pluie sans doublon (même date → remplacée sauf relevé mesuré conservé). */
  ajouterPluie(lignes: Pluie[]): Promise<number>;
}

/** Prochain id : préfixe + numéro à 3 chiffres (D010, V023…). */
export function prochainId(prefixe: string, existants: string[]): string {
  let max = 0;
  for (const id of existants) {
    const m = id.match(new RegExp(`^${prefixe}(\\d+)$`));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefixe}${String(max + 1).padStart(3, "0")}`;
}

/** Fusionne une pluie entrante dans l'existante : le relevé manuel déjà saisi est conservé. */
export function fusionnerPluie(
  existantes: Pluie[],
  entrantes: Pluie[],
): { lignes: Pluie[]; ajoutees: number } {
  const parDate = new Map(existantes.map((p) => [p.date, p]));
  let ajoutees = 0;
  for (const n of entrantes) {
    const ancien = parDate.get(n.date);
    if (!ancien) ajoutees++;
    parDate.set(n.date, {
      ...n,
      pluie_mm_mesuree: n.pluie_mm_mesuree ?? ancien?.pluie_mm_mesuree ?? null,
    });
  }
  const lignes = [...parDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  return { lignes, ajoutees };
}
