import { cache } from "react";
import { anneeCourante } from "./date";
import { getDataSource } from "./data";
import { anneesDisponibles } from "./stats";

/** Lecture des données, une seule fois par requête. */
export const chargerDonnees = cache(async () => getDataSource().lireTout());

/** Bornes du sélecteur d'année : de la première donnée de dépenses/ventes (ou récolte) à l'année en cours. */
export async function bornesAnnees() {
  const d = await chargerDonnees();
  const courante = anneeCourante();
  const { min, max } = anneesDisponibles(d, courante);
  const anneesRecolte = d.recoltes.map((r) => r.annee_recolte);
  return { min: Math.min(min, ...anneesRecolte, courante), max, courante };
}
