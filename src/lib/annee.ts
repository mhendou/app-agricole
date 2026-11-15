/** Lit ?annee=2026 dans les paramètres de page ; défaut = année en cours, bornée au sélecteur. */
export function lireAnnee(
  param: string | string[] | undefined,
  courante: number,
  min?: number,
  max?: number,
): number {
  const brut = Array.isArray(param) ? param[0] : param;
  const n = Number(brut);
  if (!brut || !Number.isInteger(n) || n < 1900 || n > 2200) return courante;
  return Math.max(min ?? n, Math.min(max ?? n, n));
}

export type ParamsPage = Promise<{ [cle: string]: string | string[] | undefined }>;

/** Première année proposée par le sélecteur de l'écran d'accueil. */
export const ANNEE_DEBUT_ACCUEIL = 2026;
