import { ecriture } from "@/lib/api";
import { getDataSource } from "@/lib/data";
import { SaisieVenteSchema } from "@/lib/saisie";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  return ecriture(req, SaisieVenteSchema, (v) => getDataSource().modifierVente(id, v));
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  return ecriture(req, null, () => getDataSource().supprimerVente(id));
}
