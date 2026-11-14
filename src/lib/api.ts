import { NextResponse } from "next/server";
import type { ZodType, z } from "zod";
import { gardeAdmin } from "./auth/server";
import { DonneeIntrouvable } from "./data/source";
import { messageErreur } from "./saisie";

/**
 * Enveloppe commune des routes d'écriture : vérifie le rôle admin, valide le corps (zod),
 * exécute l'action et traduit les erreurs en réponses JSON claires.
 */
export async function ecriture<S extends ZodType>(
  req: Request,
  schema: S | null,
  action: (donnees: z.output<S>) => Promise<unknown>,
  statut = 200,
): Promise<Response> {
  const refus = await gardeAdmin();
  if (refus) return refus;
  let donnees: z.output<S> = undefined as z.output<S>;
  if (schema) {
    try {
      donnees = schema.parse(await req.json());
    } catch (e) {
      return NextResponse.json({ erreur: messageErreur(e) }, { status: 400 });
    }
  }
  try {
    const r = await action(donnees);
    return NextResponse.json(r ?? { ok: true }, { status: statut });
  } catch (e) {
    if (e instanceof DonneeIntrouvable)
      return NextResponse.json({ erreur: e.message }, { status: 404 });
    console.error(e);
    return NextResponse.json(
      { erreur: "L'enregistrement a échoué. Réessayez dans un instant." },
      { status: 500 },
    );
  }
}
