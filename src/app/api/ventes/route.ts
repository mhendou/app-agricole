import { ecriture } from "@/lib/api";
import { getDataSource } from "@/lib/data";
import { SaisieVenteSchema } from "@/lib/saisie";

export async function POST(req: Request) {
  return ecriture(req, SaisieVenteSchema, (v) => getDataSource().ajouterVente(v), 201);
}
