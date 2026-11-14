import { FormVente } from "@/components/FormVente";
import { exigerAdminPage } from "@/lib/auth/page";
import { aujourdhui } from "@/lib/date";

export const metadata = { title: "Ajouter une vente" };

export default async function Page() {
  await exigerAdminPage();
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-titre text-3xl font-semibold text-olive-fonce">Ajouter une vente</h1>
      <FormVente aujourdhui={aujourdhui()} />
    </div>
  );
}
