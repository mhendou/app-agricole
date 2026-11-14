import { Suspense } from "react";
import { BoutonDeconnexion } from "@/components/BoutonDeconnexion";
import { BarreOnglets, MenuLateral } from "@/components/Navigation";
import { BandeauHorsLigne } from "@/components/PwaClient";
import { Rameau } from "@/components/Rameau";
import { SelecteurAnneeUrl } from "@/components/SelecteurAnneeUrl";
import { bornesAnnees, chargerDonnees } from "@/lib/donnees";
import { getRole } from "@/lib/auth/server";
import { formatHorodatage } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const [role, donnees, bornes] = await Promise.all([getRole(), chargerDonnees(), bornesAnnees()]);
  const admin = role === "admin";
  const miseAJour = formatHorodatage(donnees.lu_le);
  return (
    <div className="min-h-dvh">
      <BandeauHorsLigne miseAJour={miseAJour} />
      <header className="sticky top-0 z-20 border-b border-sauge/30 bg-sable/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <Rameau taille={36} />
            <p className="font-titre text-xl font-semibold text-olive-fonce">
              {donnees.parametres.nom_exploitation}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Suspense fallback={null}>
              <SelecteurAnneeUrl min={bornes.min} max={bornes.max} courante={bornes.courante} />
            </Suspense>
            <span
              data-testid="role"
              className={`hidden rounded-full px-3 py-1 text-base font-medium sm:inline ${admin ? "bg-ocre/25 text-[#6b4a00]" : "bg-sauge/30 text-olive-fonce"}`}
            >
              {admin ? "Administrateur" : "Lecture seule"}
            </span>
            <BoutonDeconnexion />
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl gap-8 px-4 pb-28 pt-6 lg:pb-12">
        <Suspense fallback={null}>
          <MenuLateral admin={admin} />
        </Suspense>
        <div className="min-w-0 flex-1">
          <main>{children}</main>
          <p className="mt-10 text-center text-base text-pierre">
            Dernière mise à jour : {miseAJour}
          </p>
        </div>
      </div>
      <Suspense fallback={null}>
        <BarreOnglets />
      </Suspense>
    </div>
  );
}
