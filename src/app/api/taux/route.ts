import { NextResponse } from "next/server";
import { gardeAdmin } from "@/lib/auth/server";
import { getDataSource } from "@/lib/data";
import { tauxEurMad } from "@/lib/fx";

/** Taux EUR → MAD du jour, pour pré-remplir le formulaire de vente (admin). */
export async function GET() {
  const refus = await gardeAdmin();
  if (refus) return refus;
  const { parametres } = await getDataSource().lireTout();
  return NextResponse.json(await tauxEurMad(parametres.taux_secours_eur_mad));
}
