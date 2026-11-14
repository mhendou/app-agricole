import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { Badge, Carte } from "@/components/ui";
import { exigerAdminPage } from "@/lib/auth/page";
import { controlerDonnees, lienSheet, type Alerte } from "@/lib/controle";
import { chargerDonnees } from "@/lib/donnees";

export const metadata = { title: "Contrôle des données" };

function lienLigne(a: Alerte): string | null {
  if (a.onglet === "Depenses") return `/depenses/${a.id}`;
  if (a.onglet === "Ventes") return `/ventes/${a.id}`;
  if (a.onglet === "Recoltes") return `/recoltes/${a.id}`;
  return null;
}

function Liste({ titre, aide, alertes }: { titre: string; aide: string; alertes: Alerte[] }) {
  if (alertes.length === 0) return null;
  return (
    <Carte>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-titre text-xl font-semibold">{titre}</h2>
        <Badge ton="ocre">{alertes.length}</Badge>
      </div>
      <p className="mb-2 text-base text-pierre">{aide}</p>
      <ul className="divide-y divide-sauge/30">
        {alertes.map((a) => {
          const lien = lienLigne(a);
          return (
            <li key={`${a.onglet}-${a.id}`} className="py-2">
              {lien ? (
                <Link
                  href={lien}
                  className="block min-h-11 py-1 underline-offset-4 hover:underline"
                >
                  {a.message}
                </Link>
              ) : (
                a.message
              )}
            </li>
          );
        })}
      </ul>
    </Carte>
  );
}

export default async function Page() {
  await exigerAdminPage();
  const d = await chargerDonnees();
  const c = controlerDonnees(d);
  const sheet = lienSheet();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titre text-3xl font-semibold text-olive-fonce">Contrôle des données</h1>
        {sheet ? (
          <a
            href={sheet}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-olive px-4 py-2 text-base font-medium text-creme hover:bg-olive-fonce"
          >
            Ouvrir le Google Sheet
            <ExternalLink size={18} strokeWidth={1.5} aria-hidden="true" />
          </a>
        ) : null}
      </div>

      {!sheet ? (
        <Carte ton="sauge">
          <p>
            Les données viennent actuellement de fichiers locaux de test : aucun Google Sheet
            n&apos;est relié (variable <code>SHEET_ID</code> absente).
          </p>
        </Carte>
      ) : null}

      <Carte ton={c.total === 0 ? "sauge" : "creme"}>
        <div className="flex items-center gap-3">
          <ShieldCheck size={28} strokeWidth={1.5} className="text-olive" aria-hidden="true" />
          <p className="font-titre text-xl font-semibold">
            {c.total === 0
              ? "Tout est en ordre"
              : `${c.total} point${c.total > 1 ? "s" : ""} à regarder`}
          </p>
        </div>
        <p className="mt-1 text-base text-pierre">
          {d.depenses.length} dépenses, {d.ventes.length} ventes, {d.recoltes.length} récoltes et{" "}
          {d.pluie.length} jours de pluie lus. Dernière lecture :{" "}
          {new Date(d.lu_le).toLocaleTimeString("fr-FR", {
            timeZone: "Africa/Casablanca",
            hour: "2-digit",
            minute: "2-digit",
          })}
          .
        </p>
      </Carte>

      {c.invalides.length > 0 ? (
        <Carte>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-titre text-xl font-semibold">Lignes ignorées</h2>
            <Badge ton="argile">{c.invalides.length}</Badge>
          </div>
          <p className="mb-2 text-base text-pierre">
            Ces lignes du Google Sheet sont illisibles : l&apos;appli les ignore. Corrigez-les dans
            le Sheet.
          </p>
          <ul className="divide-y divide-sauge/30">
            {c.invalides.map((l) => (
              <li key={`${l.onglet}-${l.ligne}`} className="py-2">
                <strong>
                  {l.onglet}, ligne {l.ligne}
                </strong>{" "}
                — {l.message}
              </li>
            ))}
          </ul>
        </Carte>
      ) : null}

      <Liste
        titre="À vérifier"
        aide="Lignes marquées « à vérifier » dans la colonne note."
        alertes={c.aVerifier}
      />
      <Liste
        titre="Montants à contrôler"
        aide="Le montant enregistré ne correspond pas au calcul."
        alertes={c.incoherences}
      />
      <Liste
        titre="Doublons possibles"
        aide="Deux dépenses identiques le même jour."
        alertes={c.doublons}
      />
    </div>
  );
}
