import { notFound } from "next/navigation";
import { FormDepense } from "@/components/FormDepense";
import { exigerAdminPage } from "@/lib/auth/page";
import { aujourdhui } from "@/lib/date";
import { chargerDonnees } from "@/lib/donnees";

export const metadata = { title: "Modifier une dépense" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await exigerAdminPage();
  const { id } = await params;
  const depense = (await chargerDonnees()).depenses.find((d) => d.id === id);
  if (!depense) notFound();
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-titre text-3xl font-semibold text-olive-fonce">Modifier la dépense</h1>
      <FormDepense initial={depense} aujourdhui={aujourdhui()} />
    </div>
  );
}
