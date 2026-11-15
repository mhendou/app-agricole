import { ajouterJours, aujourdhui } from "./date";
import type { DataSource } from "./data/source";
import { PREMIER_JOUR, decouperParAnnee, recupererHistorique } from "./meteo";

type Fetch = Parameters<typeof recupererHistorique>[4];

/** Ajoute les derniers jours de pluie (sans doublon). Renvoie le nombre de jours ajoutés. */
export async function majPluieRecente(
  ds: DataSource,
  jours = 10,
  f?: Fetch,
  maintenant: Date = new Date(),
): Promise<{ debut: string; fin: string; recus: number; ajoutes: number }> {
  const { parametres } = await ds.lireTout();
  const fin = ajouterJours(aujourdhui(maintenant), -1);
  const debut = ajouterJours(fin, -(jours - 1));
  const lignes = await recupererHistorique(
    parametres.latitude,
    parametres.longitude,
    debut,
    fin,
    f,
  );
  const ajoutes = await ds.ajouterPluie(lignes);
  return { debut, fin, recus: lignes.length, ajoutes };
}

/** Rattrapage de l'historique, année par année, depuis `depuis` jusqu'à hier. */
export async function rattraperPluie(
  ds: DataSource,
  depuis: string,
  f?: Fetch,
  maintenant: Date = new Date(),
  journal: (message: string) => void = () => {},
): Promise<{ recus: number; ajoutes: number }> {
  const { parametres } = await ds.lireTout();
  const fin = ajouterJours(aujourdhui(maintenant), -1);
  let recus = 0;
  let ajoutes = 0;
  for (const t of decouperParAnnee(depuis, fin)) {
    const lignes = await recupererHistorique(
      parametres.latitude,
      parametres.longitude,
      t.debut,
      t.fin,
      f,
    );
    const n = await ds.ajouterPluie(lignes);
    recus += lignes.length;
    ajoutes += n;
    journal(`${t.debut.slice(0, 4)} : ${lignes.length} jours reçus, ${n} nouveaux`);
  }
  return { recus, ajoutes };
}

/** Part minimale de l'historique déjà présente pour se contenter de la mise à jour récente. */
const SEUIL_HISTORIQUE = 0.95;

/**
 * Mise à jour quotidienne « qui se répare toute seule » : si l'onglet Pluie est vide ou très
 * incomplet (premier lancement en ligne), rattrape tout l'historique depuis 2013 ; sinon, ajoute
 * seulement les derniers jours.
 */
export async function majPluieAuto(
  ds: DataSource,
  f?: Fetch,
  maintenant: Date = new Date(),
): Promise<{ mode: "historique" | "recent"; recus: number; ajoutes: number }> {
  const { pluie } = await ds.lireTout();
  const hier = ajouterJours(aujourdhui(maintenant), -1);
  const attendus = Math.round((Date.parse(hier) - Date.parse(PREMIER_JOUR)) / 86_400_000) + 1;
  if (pluie.length < attendus * SEUIL_HISTORIQUE) {
    const r = await rattraperPluie(ds, PREMIER_JOUR, f, maintenant);
    return { mode: "historique", recus: r.recus, ajoutes: r.ajoutes };
  }
  const r = await majPluieRecente(ds, 10, f, maintenant);
  return { mode: "recent", recus: r.recus, ajoutes: r.ajoutes };
}
