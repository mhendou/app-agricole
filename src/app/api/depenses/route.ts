import { NextResponse } from "next/server";
import { z } from "zod";
import { gardeAdmin } from "@/lib/auth/server";
import { getDataSource } from "@/lib/data";
import { DepenseSchema } from "@/lib/types";

const Nouvelle = DepenseSchema.omit({ id: true });

/** Ajout d'une dépense : réservé à l'administrateur (vérifié ici, côté serveur). */
export async function POST(req: Request) {
  const refus = await gardeAdmin();
  if (refus) return refus;
  let corps;
  try {
    corps = Nouvelle.parse(await req.json());
  } catch (e) {
    const message =
      e instanceof z.ZodError ? e.issues.map((i) => i.message).join(" ; ") : "Requête invalide.";
    return NextResponse.json({ erreur: message }, { status: 400 });
  }
  const depense = await getDataSource().ajouterDepense(corps);
  return NextResponse.json(depense, { status: 201 });
}
