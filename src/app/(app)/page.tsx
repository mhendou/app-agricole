import Link from "next/link";
import { Leaf, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { BarreProportion, Carte, CarteChiffre } from "@/components/ui";
import { BoutonPartage } from "@/components/BoutonPartage";
import { Goutte, Paysage } from "@/components/Illustrations";
import { HistogrammeMensuel } from "@/components/HistogrammeMensuel";
import { ANNEE_DEBUT_ACCUEIL, lireAnnee, type ParamsPage } from "@/lib/annee";
import { getRole } from "@/lib/auth/server";
import { bornesAnnees, chargerDonnees } from "@/lib/donnees";
import { formatDH, formatEcart, formatKg, formatLitres, formatMm, formatPct } from "@/lib/format";
import { pluieAnnee, statsAnnee, statsRecoltes } from "@/lib/stats";

export default async function Page({ searchParams }: { searchParams: ParamsPage }) {
  const [d, bornes, params, role] = await Promise.all([
    chargerDonnees(),
    bornesAnnees(),
    searchParams,
    getRole(),
  ]);
  const annee = lireAnnee(
    params.annee,
    bornes.courante,
    Math.min(Math.max(bornes.min, ANNEE_DEBUT_ACCUEIL), bornes.max),
    bornes.max,
  );
  const s = statsAnnee(d, annee);
  const recoltes = statsRecoltes(
    d.recoltes.filter((r) => r.annee_recolte <= annee),
    d.parametres.nb_oliviers,
  );
  const derniere = recoltes.derniere;
  const pluie = pluieAnnee(d.pluie, annee);
  const aDePluie = d.pluie.some((p) => p.date.startsWith(String(annee)));

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-carte bg-creme shadow-carte">
        <Paysage className="absolute inset-0 h-full w-full opacity-60" />
        <div className="relative bg-gradient-to-r from-creme via-creme/85 to-transparent p-6 sm:p-8">
          <p className="text-base text-pierre">Bilan de l&apos;année</p>
          <h1 className="font-titre text-4xl font-semibold text-olive-fonce">{annee}</h1>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <CarteChiffre
          titre="Ventes encaissées"
          valeur={formatDH(s.ventesEncaissees)}
          couleur="olive"
          icone={<TrendingUp size={22} strokeWidth={1.5} className="text-olive" aria-hidden />}
          note={s.aEncaisser > 0 ? `+ ${formatDH(s.aEncaisser)} à encaisser` : undefined}
        />
        <CarteChiffre
          titre="Dépenses"
          valeur={formatDH(s.depenses)}
          couleur="argile"
          icone={
            <TrendingDown size={22} strokeWidth={1.5} className="text-argile-texte" aria-hidden />
          }
        />
        <div>
          <CarteChiffre titre="Solde" valeur={formatDH(s.solde)} fonce />
          <p className="mt-2 px-2 text-base text-pierre">
            Solde de trésorerie de l&apos;année : les ventes viennent souvent de la récolte
            précédente.
          </p>
        </div>
      </div>

      <Carte>
        {s.depensesPctVentes !== null ? (
          <>
            <p className="text-base">
              Les dépenses représentent{" "}
              <strong className="font-titre text-xl text-argile-texte">
                {formatPct(s.depensesPctVentes, 0)}
              </strong>{" "}
              des ventes encaissées.
            </p>
            <div className="mt-3">
              <BarreProportion
                valeur={Math.min(s.depensesPctVentes, 100)}
                libelle="Part des dépenses dans les ventes"
                couleur="argile"
              />
            </div>
          </>
        ) : (
          <p className="text-pierre">Aucune vente encaissée pour le moment cette année.</p>
        )}
      </Carte>

      <div className="grid gap-4 lg:grid-cols-3">
        <Carte className="lg:col-span-2">
          <h2 className="font-titre mb-3 text-xl font-semibold">Mois par mois</h2>
          <HistogrammeMensuel donnees={s.parMois} />
        </Carte>

        <div className="space-y-4">
          <Carte>
            <div className="flex items-center justify-between">
              <h2 className="font-titre text-xl font-semibold">Dernière récolte</h2>
              <Leaf size={22} strokeWidth={1.5} className="text-olive" aria-hidden />
            </div>
            {derniere && derniere.kg !== null ? (
              <div className="mt-3 space-y-1">
                <p className="text-pierre">Récolte {derniere.annee}</p>
                <p className="font-titre flex flex-wrap items-baseline gap-x-4 text-3xl font-semibold text-olive">
                  <span>{formatKg(derniere.kg)}</span>
                  {derniere.litres !== null ? <span>{formatLitres(derniere.litres)}</span> : null}
                </p>
                {derniere.litres === null ? (
                  <p className="text-pierre">Huile : non renseignée</p>
                ) : null}
                {derniere.rendementPct !== null ? (
                  <p className="text-pierre">Rendement {formatPct(derniere.rendementPct)}</p>
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

          <Carte>
            <div className="flex items-center gap-3">
              <Goutte />
              <div>
                <h2 className="font-titre text-xl font-semibold">Pluie {annee}</h2>
                <p className="font-titre text-2xl font-semibold text-ciel">
                  {aDePluie ? formatMm(pluie) : "—"}
                </p>
              </div>
            </div>
            {!aDePluie ? (
              <p className="mt-2 text-pierre">Pas encore de relevé pour cette année.</p>
            ) : null}
            <Link
              href={`/meteo?annee=${annee}`}
              className="mt-3 inline-flex min-h-11 items-center text-base font-medium text-olive-fonce underline underline-offset-4"
            >
              Voir la météo et la prévision
            </Link>
          </Carte>
        </div>
      </div>

      <Carte ton="sauge">
        <h2 className="font-titre mb-1 text-xl font-semibold">Partager le bilan</h2>
        <p className="mb-3 text-base">
          Une image du bilan {annee} à envoyer à la famille, par WhatsApp par exemple.
        </p>
        <BoutonPartage annee={annee} />
      </Carte>

      {role === "admin" ? (
        <Link
          href="/admin/controle"
          className="flex min-h-14 items-center gap-3 rounded-carte bg-creme p-4 font-medium shadow-carte"
        >
          <ShieldCheck size={22} strokeWidth={1.5} className="text-olive" aria-hidden="true" />
          Contrôle des données (administrateur)
        </Link>
      ) : null}
    </div>
  );
}
