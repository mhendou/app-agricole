import { CloudRain, ExternalLink, Sun } from "lucide-react";
import { Carte, CarteChiffre, EtatVide } from "@/components/ui";
import { Goutte } from "@/components/Illustrations";
import { GraphiquePluieMois, GraphiquePluieProduction } from "@/components/GraphiquesMeteo";
import { lireAnnee, type ParamsPage } from "@/lib/annee";
import { bornesAnnees, chargerDonnees } from "@/lib/donnees";
import { formatMm, jourSemaine, nomMois } from "@/lib/format";
import { ATTRIBUTION_METEO, prevision7j, type JourPrevision } from "@/lib/meteo";
import { pluieAnnee, pluieParAnnee, pluieParMois } from "@/lib/stats";

export const metadata = { title: "Météo" };

async function chargerPrevision(lat: number, lon: number): Promise<JourPrevision[] | null> {
  try {
    return await prevision7j(lat, lon);
  } catch {
    return null;
  }
}

export default async function Page({ searchParams }: { searchParams: ParamsPage }) {
  const [d, bornes, params] = await Promise.all([chargerDonnees(), bornesAnnees(), searchParams]);
  const annee = lireAnnee(params.annee, bornes.courante, bornes.min, bornes.max);
  const { latitude, longitude, lien_meteoblue } = d.parametres;
  const prevision = await chargerPrevision(latitude, longitude);

  const mois = pluieParMois(d.pluie, annee);
  const total = pluieAnnee(d.pluie, annee);
  const joursPluie = mois.reduce((s, m) => s + m.joursPluie, 0);
  const plusPluvieux = [...mois].sort((a, b) => b.mm - a.mm)[0];
  const aDesDonnees = d.pluie.some((p) => p.date.startsWith(String(annee)));

  const parAnnee = new Map(pluieParAnnee(d.pluie).map((p) => [p.annee, p.mm]));
  const anneesCompletes = [...parAnnee.keys()].filter((a) => a < bornes.courante);
  const production = d.recoltes.map((r) => r.annee_recolte).filter((a) => parAnnee.has(a));
  const toutesAnnees = [...new Set([...anneesCompletes, ...production])].sort();
  const pluieProduction = toutesAnnees.map((a) => ({
    annee: a,
    mm: parAnnee.get(a) ?? null,
    kg: d.recoltes.find((r) => r.annee_recolte === a)?.kg_olives ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-3xl font-semibold text-olive-fonce">Météo {annee}</h1>
        <a
          href={lien_meteoblue}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-sauge bg-creme px-4 py-2 text-base font-medium text-olive-fonce hover:bg-sauge/20"
        >
          Ouvrir Meteoblue
          <ExternalLink size={18} strokeWidth={1.5} aria-hidden="true" />
        </a>
      </div>

      {!aDesDonnees ? (
        <EtatVide
          titre="Pas encore de relevé de pluie pour cette année"
          texte="L'historique se met à jour chaque jour automatiquement."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <CarteChiffre
            titre={`Pluie cumulée ${annee}`}
            valeur={formatMm(total)}
            couleur="encre"
            icone={<Goutte taille={28} />}
          />
          <CarteChiffre titre="Jours de pluie" valeur={String(joursPluie)} note="au moins 1 mm" />
          <CarteChiffre
            titre="Mois le plus pluvieux"
            valeur={plusPluvieux.mm > 0 ? nomMois(plusPluvieux.mois) : "—"}
            note={plusPluvieux.mm > 0 ? formatMm(plusPluvieux.mm) : undefined}
          />
        </div>
      )}

      <Carte>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-titre text-xl font-semibold">Les 7 prochains jours</h2>
          <CloudRain size={22} strokeWidth={1.5} className="text-ciel" aria-hidden="true" />
        </div>
        {prevision && prevision.length > 0 ? (
          <ul className="divide-y divide-sauge/30">
            {prevision.map((j) => (
              <li key={j.date} className="flex min-h-14 items-center gap-3 py-2">
                {j.pluie_mm >= 1 ? (
                  <CloudRain
                    size={24}
                    strokeWidth={1.5}
                    className="shrink-0 text-ciel"
                    aria-hidden="true"
                  />
                ) : (
                  <Sun
                    size={24}
                    strokeWidth={1.5}
                    className="shrink-0 text-[#8a6a10]"
                    aria-hidden="true"
                  />
                )}
                <span className="w-28 capitalize">{jourSemaine(j.date)}</span>
                <span className="flex-1 text-pierre">
                  {j.pluie_mm >= 0.1 ? formatMm(j.pluie_mm) : "Sec"}
                  {j.probabilite !== null && j.pluie_mm >= 0.1 ? ` · ${j.probabilite} %` : ""}
                </span>
                <span className="whitespace-nowrap font-medium">
                  {j.temp_max !== null ? `${Math.round(j.temp_max)}°` : "—"}
                  <span className="text-pierre">
                    {" "}
                    / {j.temp_min !== null ? `${Math.round(j.temp_min)}°` : "—"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-pierre">
            La prévision n&apos;est pas disponible pour le moment. Réessayez plus tard.
          </p>
        )}
      </Carte>

      <Carte>
        <h2 className="font-titre mb-3 text-xl font-semibold">Pluie par mois en {annee}</h2>
        <GraphiquePluieMois donnees={mois} />
      </Carte>

      {pluieProduction.length > 1 ? (
        <Carte>
          <h2 className="font-titre text-xl font-semibold">Pluie annuelle et récolte</h2>
          <p className="mb-3 text-base text-pierre">
            À titre indicatif : la récolte dépend aussi de la floraison, des traitements, de
            l&apos;alternance d&apos;une année sur l&apos;autre… la pluie seule n&apos;explique pas
            tout.
          </p>
          <GraphiquePluieProduction donnees={pluieProduction} />
        </Carte>
      ) : null}

      <p className="text-center text-base text-pierre">
        {ATTRIBUTION_METEO} —{" "}
        <a
          className="underline"
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          open-meteo.com
        </a>
      </p>
    </div>
  );
}
