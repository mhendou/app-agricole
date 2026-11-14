import { notFound } from "next/navigation";
import { FormRecolte } from "@/components/FormRecolte";
import { exigerAdminPage } from "@/lib/auth/page";
import { chargerDonnees } from "@/lib/donnees";

export const metadata = { title: "Modifier une récolte" };

export default async function Page({ params }: { params: Promise<{ annee: string }> }) {
  await exigerAdminPage();
  const annee = Number((await params).annee);
  const recolte = (await chargerDonnees()).recoltes.find((r) => r.annee_recolte === annee);
  if (!recolte) notFound();
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-titre text-3xl font-semibold text-olive-fonce">Récolte {annee}</h1>
      <FormRecolte initial={recolte} anneeParDefaut={annee} />
    </div>
  );
}
