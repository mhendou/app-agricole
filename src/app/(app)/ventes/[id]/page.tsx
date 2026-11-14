import { notFound } from "next/navigation";
import { FormVente } from "@/components/FormVente";
import { exigerAdminPage } from "@/lib/auth/page";
import { aujourdhui } from "@/lib/date";
import { chargerDonnees } from "@/lib/donnees";

export const metadata = { title: "Modifier une vente" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await exigerAdminPage();
  const { id } = await params;
  const vente = (await chargerDonnees()).ventes.find((v) => v.id === id);
  if (!vente) notFound();
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-titre text-3xl font-semibold text-olive-fonce">Modifier la vente</h1>
      <FormVente initial={vente} aujourdhui={aujourdhui()} />
    </div>
  );
}
