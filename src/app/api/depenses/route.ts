import { ecriture } from "@/lib/api";
import { getDataSource } from "@/lib/data";
import { SaisieDepenseSchema } from "@/lib/saisie";

/** Ajout d'une dépense : réservé à l'administrateur (vérifié ici, côté serveur). */
export async function POST(req: Request) {
  return ecriture(req, SaisieDepenseSchema, (d) => getDataSource().ajouterDepense(d), 201);
}
