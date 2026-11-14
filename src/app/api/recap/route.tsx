import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { lireAnnee } from "@/lib/annee";
import { getRole } from "@/lib/auth/server";
import { bornesAnnees, chargerDonnees } from "@/lib/donnees";
import { HAUTEUR, LARGEUR, RecapImage, polices } from "@/lib/recap";
import { statsAnnee, statsRecoltes } from "@/lib/stats";

export const dynamic = "force-dynamic";

/** Image PNG du récap de l'année (lecture : famille et admin). */
export async function GET(req: Request) {
  if ((await getRole()) === null) {
    return NextResponse.json({ erreur: "Connexion requise." }, { status: 401 });
  }
  const [d, bornes] = await Promise.all([chargerDonnees(), bornesAnnees()]);
  const annee = lireAnnee(
    new URL(req.url).searchParams.get("annee") ?? undefined,
    bornes.courante,
    bornes.min,
    bornes.max,
  );
  const stats = statsAnnee(d, annee);
  const recolte = statsRecoltes(
    d.recoltes.filter((r) => r.annee_recolte <= annee),
    d.parametres.nb_oliviers,
  ).derniere;
  return new ImageResponse(
    <RecapImage
      annee={annee}
      nom={d.parametres.nom_exploitation}
      stats={stats}
      recolte={recolte}
    />,
    {
      width: LARGEUR,
      height: HAUTEUR,
      fonts: await polices(),
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
