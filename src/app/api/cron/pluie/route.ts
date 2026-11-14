import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";
import { majPluieRecente } from "@/lib/pluie-service";

export const dynamic = "force-dynamic";

function secretValide(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // sans secret configuré, la route reste fermée
  const recu = req.headers.get("authorization") ?? "";
  const attendu = `Bearer ${secret}`;
  const a = Buffer.from(recu);
  const b = Buffer.from(attendu);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Cron quotidien (Vercel) : ajoute les derniers jours de pluie dans l'onglet Pluie, sans doublon. */
export async function GET(req: Request) {
  if (!secretValide(req)) return NextResponse.json({ erreur: "Non autorisé." }, { status: 401 });
  try {
    return NextResponse.json(await majPluieRecente(getDataSource()));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ erreur: "Mise à jour de la pluie impossible." }, { status: 502 });
  }
}
