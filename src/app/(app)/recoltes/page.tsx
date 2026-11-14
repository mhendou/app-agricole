import Link from "next/link";
import { Trophy } from "lucide-react";
import { Badge, Carte, CarteChiffre, EtatVide } from "@/components/ui";
import { BoutonAjout } from "@/components/BoutonAjout";
import { HistogrammeRecoltes } from "@/components/HistogrammeRecoltes";
import { lireAnnee, type ParamsPage } from "@/lib/annee";
import { getRole } from "@/lib/auth/server";
import { bornesAnnees, chargerDonnees } from "@/lib/donnees";
import { formatEcart, formatKg, formatLitres, formatNombre, formatPct } from "@/lib/format";
import { rangRecolte, statsRecoltes } from "@/lib/stats";

export const metadata = { title: "Récoltes" };

export default async function Page({ searchParams }: { searchParams: ParamsPage }) {
  const [d, bornes, params, role] = await Promise.all([
    chargerDonnees(),
    bornesAnnees(),
    searchParams,
    getRole(),
  ]);
  const annee = lireAnnee(params.annee, bornes.courante, bornes.min, bornes.max);
  const admin = role === "admin";
  const s = statsRecoltes(d.recoltes, d.parametres.nb_oliviers);
  const choisie = s.annees.find((a) => a.annee === annee);
  const rang = rangRecolte(d.recoltes, annee);
  const nbConnues = s.annees.filter((a) => !a.perdue).length;

  if (s.annees.length === 0) {
    return (
      <EtatVide
        titre="Aucune récolte enregistrée"
        texte="Les récoltes apparaîtront ici dès qu'elles seront saisies."
        action={
          admin ? (
            <BoutonAjout href="/recoltes/nouvelle" libelle="Ajouter une récolte" />
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-3xl font-semibold text-olive-fonce">Récoltes</h1>
        {admin ? (
          <BoutonAjout href="/recoltes/nouvelle" libelle="Ajouter ou corriger une année" />
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CarteChiffre
          titre="Record"
          valeur={s.record ? formatKg(s.record.kg) : "—"}
          couleur="olive"
          note={s.record ? `Récolte ${s.record.annee}` : undefined}
          icone={<Trophy size={22} strokeWidth={1.5} className="text-ocre" aria-hidden="true" />}
        />
        <CarteChiffre
          titre="Moyenne"
          valeur={s.moyenneKg !== null ? formatKg(Math.round(s.moyenneKg)) : "—"}
          note={`sur ${nbConnues} années connues`}
        />
        <CarteChiffre
          titre="Rendement en huile"
          valeur={s.rendementMoyenPct !== null ? formatPct(s.rendementMoyenPct) : "—"}
          note="litres d'huile ÷ kilos d'olives"
        />
        <CarteChiffre
          titre="Par arbre"
          valeur={s.kgParArbreMoyen !== null ? `${formatNombre(s.kgParArbreMoyen)} kg` : "—"}
          note={`en moyenne, sur ${d.parametres.nb_oliviers} oliviers`}
        />
      </div>

      <Carte>
        <h2 className="font-titre mb-3 text-xl font-semibold">
          {s.annees[0].annee} → {s.annees[s.annees.length - 1].annee}
        </h2>
        <HistogrammeRecoltes
          anneeSelectionnee={annee}
          donnees={s.annees.map((a) => ({
            annee: a.annee,
            kg: a.kg,
            litres: a.litres,
            perdue: a.perdue,
          }))}
        />
      </Carte>

      <Carte ton="sauge">
        <h2 className="font-titre text-xl font-semibold">Récolte {annee}</h2>
        {!choisie ? (
          <p className="mt-2">Aucune récolte enregistrée pour {annee}.</p>
        ) : choisie.perdue ? (
          <p className="mt-2">Donnée perdue : cette année-là n&apos;a pas été conservée.</p>
        ) : choisie.kg === 0 ? (
          <p className="mt-2">Pas de récolte cette année-là (0 kg).</p>
        ) : (
          <dl className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div>
              <dt className="text-base text-pierre">Olives</dt>
              <dd className="font-titre text-2xl font-semibold">{formatKg(choisie.kg ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-base text-pierre">Huile</dt>
              <dd className="font-titre text-2xl font-semibold">
                {choisie.litres !== null ? formatLitres(choisie.litres) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-base text-pierre">Rendement</dt>
              <dd className="font-titre text-2xl font-semibold">
                {choisie.rendementPct !== null ? formatPct(choisie.rendementPct) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-base text-pierre">Par arbre</dt>
              <dd className="font-titre text-2xl font-semibold">
                {choisie.kgParArbre !== null ? `${formatNombre(choisie.kgParArbre)} kg` : "—"}
              </dd>
            </div>
          </dl>
        )}
        {choisie && !choisie.perdue ? (
          <p className="mt-3 flex flex-wrap items-center gap-2">
            {rang ? (
              <Badge ton="olive">
                {rang === 1 ? "Meilleure année" : `${rang}e meilleure année`}
              </Badge>
            ) : null}
            {choisie.ecartKg !== null ? (
              <Badge ton={choisie.ecartKg >= 0 ? "olive" : "argile"}>
                {formatEcart(choisie.ecartKg, "kg")} vs {annee - 1}
              </Badge>
            ) : null}
          </p>
        ) : null}
        {choisie?.note ? <p className="mt-2 text-base text-pierre">{choisie.note}</p> : null}
      </Carte>

      <Carte className="!p-2">
        <h2 className="font-titre px-3 pt-3 text-xl font-semibold">Année par année</h2>
        <ul className="divide-y divide-sauge/30">
          {[...s.annees].reverse().map((a) => {
            const contenu = (
              <div className="flex min-h-14 items-center justify-between gap-3 p-2">
                <span className="font-titre text-lg font-semibold">{a.annee}</span>
                <span className="text-right">
                  {a.perdue ? (
                    <span className="hachure rounded-full px-3 py-1 text-base font-medium">
                      donnée perdue
                    </span>
                  ) : (
                    <>
                      <span className="font-medium">{formatKg(a.kg ?? 0)}</span>
                      {a.litres !== null ? (
                        <span className="text-pierre"> · {formatLitres(a.litres)}</span>
                      ) : null}
                    </>
                  )}
                </span>
              </div>
            );
            return (
              <li key={a.annee}>
                {admin ? (
                  <Link
                    href={`/recoltes/${a.annee}`}
                    className="block rounded-xl hover:bg-sauge/15"
                  >
                    {contenu}
                  </Link>
                ) : (
                  contenu
                )}
              </li>
            );
          })}
        </ul>
      </Carte>
    </div>
  );
}
