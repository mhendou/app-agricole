import { getRole } from "@/lib/auth/server";
import { BoutonDeconnexion } from "./BoutonDeconnexion";

export const dynamic = "force-dynamic";

export default async function Page() {
  const role = await getRole();
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="font-titre text-3xl font-semibold text-olive-fonce">
        Oliveraie d&apos;Afourer
      </h1>
      <p data-testid="role">{role === "admin" ? "Administrateur" : "Lecture seule"}</p>
      {role === "admin" ? (
        <a href="/depenses/nouvelle" className="underline">
          Ajouter une dépense
        </a>
      ) : null}
      <BoutonDeconnexion />
    </main>
  );
}
