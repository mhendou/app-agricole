import { ecriture } from "@/lib/api";
import { getDataSource } from "@/lib/data";
import { SaisieRecolteSchema } from "@/lib/saisie";

/** Ajoute ou corrige la récolte d'une année. */
export async function PUT(req: Request) {
  return ecriture(req, SaisieRecolteSchema, (r) => getDataSource().enregistrerRecolte(r));
}
