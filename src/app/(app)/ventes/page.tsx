import Link from "next/link";
import { Clock } from "lucide-react";
import { Badge, BarreProportion, Carte, CarteChiffre, EtatVide } from "@/components/ui";
import { BandeauSucces } from "@/components/BandeauSucces";
import { BoutonAjout } from "@/components/BoutonAjout";
import { lireAnnee, type ParamsPage } from "@/lib/annee";
import { getRole } from "@/lib/auth/server";
import { bornesAnnees, chargerDonnees } from "@/lib/donnees";
import { formatDate, formatDH, formatLitres, formatNombre } from "@/lib/format";
import { statsAnnee } from "@/lib/stats";
import type { Vente } from "@/lib/types";

export const metadata = { title: "Ventes" };

const TON_STATUT = { payé: "olive", "à encaisser": "ocre", offert: "pierre" } as const;

function Ligne({ v }: { v: Vente }) {
  const detail =
    v.statut === "offert"
      ? `${formatLitres(v.litres)} offert${v.litres > 1 ? "s" : ""}`
      : v.devise === "EUR"
        ? `${formatLitres(v.litres)} × ${formatNombre(v.prix_unitaire, 2)} €${v.taux_eur_mad ? ` (taux ${formatNombre(v.taux_eur_mad, 4)})` : ""}`
        : `${formatLitres(v.litres)} × ${formatNombre(v.prix_unitaire, 0)} DH`;
  return (
    <div className="flex min-h-16 items-center gap-3 p-2">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {v.client || "Client non renseigné"}
          {v.ville ? <span className="font-normal text-pierre"> · {v.ville}</span> : null}
        </p>
        <p className="text-base text-pierre">
          {formatDate(v.date)} · {detail}
        </p>
        {v.note ? <p className="text-base text-pierre">{v.note}</p> : null}
      </div>
      <div className="flex flex-col items-end gap-1">
        <p className="whitespace-nowrap font-titre text-lg font-semibold text-olive">
          {v.statut === "offert" ? "—" : formatDH(v.montant_dh)}
        </p>
        <Badge ton={TON_STATUT[v.statut]}>{v.statut}</Badge>
      </div>
    </div>
  );
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
  const ventes = d.ventes
    .filter((v) => v.date.startsWith(String(annee)))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const totalLitres = s.repartition.maroc.litres + s.repartition.horsMaroc.litres;

  return (
    <div className="space-y-6">
      <BandeauSucces ok={params.ok} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-3xl font-semibold text-olive-fonce">Ventes {annee}</h1>
        {admin ? <BoutonAjout href="/ventes/nouvelle" libelle="Ajouter une vente" /> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <CarteChiffre
          titre="Ventes encaissées"
          valeur={formatDH(s.ventesEncaissees)}
          couleur="olive"
        />
        <section
          className={`rounded-carte p-5 shadow-carte anim-apparition ${s.aEncaisser > 0 ? "border-2 border-ocre bg-ocre/15" : "bg-creme"}`}
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-medium text-pierre">À encaisser</h3>
            <Clock size={22} strokeWidth={1.5} className="text-[#6b4a00]" aria-hidden="true" />
          </div>
          <p className="font-titre mt-2 text-4xl font-semibold text-[#6b4a00]">
            {formatDH(s.aEncaisser)}
          </p>
          <p className="mt-2 text-base text-pierre">
            {s.aEncaisser > 0 ? "Pas encore reçu : à relancer" : "Tout est encaissé"}
          </p>
        </section>
        <CarteChiffre
          titre="Litres vendus"
          valeur={formatLitres(s.litresVendus)}
          note={
            <>
              {s.prixMoyenLitre !== null
                ? `Prix moyen ${formatDH(s.prixMoyenLitre)}/L`
                : "Aucune vente"}
              {s.litresOfferts > 0 ? ` · ${formatLitres(s.litresOfferts)} offerts` : ""}
            </>
          }
        />
      </div>

      <Carte>
        <h2 className="font-titre mb-3 text-xl font-semibold">Maroc et hors Maroc</h2>
        {totalLitres === 0 ? (
          <p className="text-pierre">Aucune vente cette année.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { nom: "Maroc", r: s.repartition.maroc },
              { nom: "Hors Maroc", r: s.repartition.horsMaroc },
            ].map(({ nom, r }) => (
              <div key={nom}>
                <div className="flex items-baseline justify-between">
                  <span>{nom}</span>
                  <span className="font-medium">
                    {formatLitres(r.litres)} · {formatDH(r.montant)}
                  </span>
                </div>
                <div className="mt-1">
                  <BarreProportion
                    valeur={r.litres}
                    max={totalLitres}
                    libelle={`Litres vendus ${nom}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Carte>

      {ventes.length === 0 ? (
        <EtatVide titre="Aucune vente" texte={`Rien n'a été enregistré en ${annee}.`} />
      ) : (
        <Carte className="!p-2">
          <h2 className="font-titre px-3 pt-3 text-xl font-semibold">Toutes les ventes</h2>
          <ul className="divide-y divide-sauge/30">
            {ventes.map((v) => (
              <li key={v.id}>
                {admin ? (
                  <Link href={`/ventes/${v.id}`} className="block rounded-xl hover:bg-sauge/15">
                    <Ligne v={v} />
                  </Link>
                ) : (
                  <Ligne v={v} />
                )}
              </li>
            ))}
          </ul>
        </Carte>
      )}
    </div>
  );
}
