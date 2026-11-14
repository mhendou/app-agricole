import Link from "next/link";
import { BarreProportion, Carte, CarteChiffre, EtatVide } from "@/components/ui";
import { BoutonAjout } from "@/components/BoutonAjout";
import { IconeCategorie } from "@/components/IconeCategorie";
import { lireAnnee, type ParamsPage } from "@/lib/annee";
import { getRole } from "@/lib/auth/server";
import { bornesAnnees, chargerDonnees } from "@/lib/donnees";
import { formatDate, formatDH, formatPct, nomMois } from "@/lib/format";
import { statsAnnee } from "@/lib/stats";
import type { Depense } from "@/lib/types";

export const metadata = { title: "Dépenses" };

function groupesParMois(deps: Depense[]) {
  const m = new Map<number, Depense[]>();
  for (const d of deps) {
    const mois = Number(d.date.slice(5, 7));
    m.set(mois, [...(m.get(mois) ?? []), d]);
  }
  return [...m.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([mois, lignes]) => ({
      mois,
      lignes: lignes.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
      total: lignes.reduce((s, l) => s + l.montant_dh, 0),
    }));
}

export default async function Page({ searchParams }: { searchParams: ParamsPage }) {
  const [d, bornes, params, role] = await Promise.all([
    chargerDonnees(),
    bornesAnnees(),
    searchParams,
    getRole(),
  ]);
  const annee = lireAnnee(params.annee, bornes.courante, bornes.min, bornes.max);
  const admin = role === "admin";
  const s = statsAnnee(d, annee);
  const deps = d.depenses.filter((x) => x.date.startsWith(String(annee)));
  const groupes = groupesParMois(deps);
  const max = s.depensesParCategorie[0]?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-3xl font-semibold text-olive-fonce">Dépenses {annee}</h1>
        {admin ? <BoutonAjout href="/depenses/nouvelle" libelle="Ajouter une dépense" /> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <CarteChiffre
          titre="Total des dépenses"
          valeur={formatDH(s.depenses)}
          couleur="argile"
          note={`${deps.length} dépense${deps.length > 1 ? "s" : ""}`}
        />
        <Carte className="lg:col-span-2">
          <h2 className="font-titre mb-3 text-xl font-semibold">Par catégorie</h2>
          {s.depensesParCategorie.length === 0 ? (
            <p className="text-pierre">Aucune dépense cette année.</p>
          ) : (
            <ul className="space-y-3">
              {s.depensesParCategorie.map((c) => (
                <li key={c.categorie}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span>{c.categorie}</span>
                    <span className="whitespace-nowrap font-medium">
                      {formatDH(c.total)}{" "}
                      <span className="text-pierre">
                        · {formatPct((c.total / s.depenses) * 100, 0)}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1">
                    <BarreProportion
                      valeur={c.total}
                      max={max}
                      couleur="argile"
                      libelle={`${c.categorie}`}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>

      {groupes.length === 0 ? (
        <EtatVide titre="Aucune dépense" texte={`Rien n'a été enregistré en ${annee}.`} />
      ) : (
        groupes.map((g) => (
          <section key={g.mois} aria-labelledby={`mois-${g.mois}`}>
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 id={`mois-${g.mois}`} className="font-titre text-xl font-semibold capitalize">
                {nomMois(g.mois)} {annee}
              </h2>
              <p className="font-medium text-argile">{formatDH(g.total)}</p>
            </div>
            <Carte className="!p-2">
              <ul className="divide-y divide-sauge/30">
                {g.lignes.map((l) => {
                  const contenu = (
                    <>
                      <IconeCategorie categorie={l.categorie} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{l.description || l.categorie}</p>
                        <p className="truncate text-base text-pierre">
                          {formatDate(l.date)}
                          {l.beneficiaire ? ` · ${l.beneficiaire}` : ""}
                          {l.mode_paiement ? ` · ${l.mode_paiement}` : ""}
                        </p>
                        {l.note ? <p className="text-base text-pierre">{l.note}</p> : null}
                      </div>
                      <p className="whitespace-nowrap font-titre text-lg font-semibold text-argile">
                        {formatDH(l.montant_dh)}
                      </p>
                    </>
                  );
                  return (
                    <li key={l.id}>
                      {admin ? (
                        <Link
                          href={`/depenses/${l.id}`}
                          className="flex min-h-16 items-center gap-3 rounded-xl p-2 hover:bg-sauge/15"
                        >
                          {contenu}
                        </Link>
                      ) : (
                        <div className="flex min-h-16 items-center gap-3 p-2">{contenu}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Carte>
          </section>
        ))
      )}
    </div>
  );
}
