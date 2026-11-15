import { Leaf, Weight } from "lucide-react";
import { Carte } from "@/components/ui";
import { BouteilleHuile } from "@/components/Illustrations";
import { formatEcart, formatKg, formatLitres, formatPct } from "@/lib/format";
import type { statsRecoltes } from "@/lib/stats";

type Derniere = ReturnType<typeof statsRecoltes>["derniere"];

/** Aperçu de la dernière récolte : kilos d'olives et litres d'huile en vedette, rendement dessous. */
export function CarteDerniereRecolte({ derniere }: { derniere: Derniere }) {
  return (
    <Carte>
      <div className="flex items-center justify-between">
        <h2 className="font-titre text-xl font-semibold">Dernière récolte</h2>
        <Leaf size={22} strokeWidth={1.5} className="text-olive" aria-hidden />
      </div>
      {derniere && derniere.kg !== null ? (
        <div className="mt-3">
          <p className="text-pierre">Récolte {derniere.annee}</p>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Weight size={30} strokeWidth={1.5} className="shrink-0 text-olive" aria-hidden />
              <p className="font-titre whitespace-nowrap text-2xl font-semibold text-olive sm:text-3xl">
                {formatKg(derniere.kg)}
              </p>
            </div>
            {derniere.litres !== null ? (
              <div className="flex flex-col gap-1">
                <BouteilleHuile taille={32} className="shrink-0 text-olive" />
                <p className="font-titre whitespace-nowrap text-2xl font-semibold text-olive sm:text-3xl">
                  {formatLitres(derniere.litres)}
                </p>
              </div>
            ) : (
              <p className="self-center text-pierre">Huile : non renseignée</p>
            )}
          </div>
          {derniere.rendementPct !== null ? (
            <p className="mt-3 text-pierre">Rendement {formatPct(derniere.rendementPct)}</p>
          ) : null}
          {derniere.ecartKg !== null ? (
            <p className={derniere.ecartKg >= 0 ? "text-olive" : "text-argile-texte"}>
              {formatEcart(derniere.ecartKg, "kg")} vs {derniere.annee - 1}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-pierre">Aucune récolte enregistrée.</p>
      )}
    </Carte>
  );
}
