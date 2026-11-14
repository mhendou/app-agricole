import { FormRecolte } from "@/components/FormRecolte";
import { exigerAdminPage } from "@/lib/auth/page";
import { aujourdhui } from "@/lib/date";

export const metadata = { title: "Ajouter une récolte" };

export default async function Page() {
  await exigerAdminPage();
  // Les récoltes se font surtout en fin d'année / début de suivante : on propose l'année précédente en janvier-février.
  const [a, m] = aujourdhui().split("-").map(Number);
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-titre text-3xl font-semibold text-olive-fonce">
        Ajouter ou corriger une année
      </h1>
      <FormRecolte anneeParDefaut={m <= 2 ? a - 1 : a} />
    </div>
  );
}
