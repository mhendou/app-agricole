import { FormDepense } from "@/components/FormDepense";
import { exigerAdminPage } from "@/lib/auth/page";
import { aujourdhui } from "@/lib/date";

export const metadata = { title: "Ajouter une dépense" };

export default async function Page() {
  await exigerAdminPage();
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-titre text-3xl font-semibold text-olive-fonce">Ajouter une dépense</h1>
      <FormDepense aujourdhui={aujourdhui()} />
    </div>
  );
}
