import { NextResponse } from "next/server";
import { ecriture } from "@/lib/api";
import { getDataSource } from "@/lib/data";

type Ctx = { params: Promise<{ annee: string }> };

export async function DELETE(req: Request, { params }: Ctx) {
  const annee = Number((await params).annee);
  if (!Number.isInteger(annee)) {
    return NextResponse.json({ erreur: "Année invalide." }, { status: 400 });
  }
  return ecriture(req, null, () => getDataSource().supprimerRecolte(annee));
}
