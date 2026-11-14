import { ecriture } from "@/lib/api";
import { getDataSource } from "@/lib/data";
import { SaisieDepenseSchema } from "@/lib/saisie";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  return ecriture(req, SaisieDepenseSchema, (d) => getDataSource().modifierDepense(id, d));
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  return ecriture(req, null, () => getDataSource().supprimerDepense(id));
}
