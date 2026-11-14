"use client";

import { useEffect, useState } from "react";
import { Bouton, Carte } from "./ui";
import { BlocErreur, Champ, SuppressionConfirmee, classeInput, useEnvoi } from "./formulaire";
import { formatDH, formatNombre } from "@/lib/format";
import { parseNombre } from "@/lib/parse";
import { MODES_PAIEMENT, STATUTS, type Vente } from "@/lib/types";

const num = (n: number | null | undefined) =>
  n === null || n === undefined ? "" : String(n).replace(".", ",");

type Taux = { taux: number; source: string };

/** Montant calculé : litres × prix (× taux si en euros) ; 0 pour une vente offerte. */
export function montantCalcule(
  litres: number | null,
  prix: number | null,
  devise: "MAD" | "EUR",
  taux: number | null,
  statut: string,
): number | null {
  if (statut === "offert") return 0;
  if (litres === null || prix === null || Number.isNaN(litres) || Number.isNaN(prix)) return null;
  if (devise === "EUR") {
    if (taux === null || Number.isNaN(taux)) return null;
    return Math.round(litres * prix * taux);
  }
  return Math.round(litres * prix);
}

export function FormVente({ initial, aujourdhui }: { initial?: Vente; aujourdhui: string }) {
  const annee = (initial?.date ?? aujourdhui).slice(0, 4);
  const { erreur, envoi, setErreur, envoyer } = useEnvoi(`/ventes?annee=${annee}`);
  const [date, setDate] = useState(initial?.date ?? aujourdhui);
  const [client, setClient] = useState(initial?.client ?? "");
  const [ville, setVille] = useState(initial?.ville ?? "");
  const [pays, setPays] = useState(initial?.pays ?? "Maroc");
  const [devise, setDevise] = useState<"MAD" | "EUR">(initial?.devise ?? "MAD");
  const [litres, setLitres] = useState(num(initial?.litres));
  const [prix, setPrix] = useState(num(initial?.prix_unitaire));
  const [taux, setTaux] = useState(num(initial?.taux_eur_mad));
  const [tauxInfo, setTauxInfo] = useState<Taux | null>(null);
  const [statut, setStatut] = useState<string>(initial?.statut ?? "payé");
  const [mode, setMode] = useState(initial?.mode_encaissement ?? "virement");
  const [note, setNote] = useState(initial?.note ?? "");

  const calcule = montantCalcule(
    parseNombre(litres),
    parseNombre(prix),
    devise,
    parseNombre(taux),
    statut,
  );
  // Le montant stocké fait référence : s'il diffère du calcul (correction à la main), on le conserve.
  const [montantManuel, setMontantManuel] = useState<string | null>(
    initial && initial.montant_dh !== calcule && calcule !== null
      ? String(initial.montant_dh)
      : null,
  );
  const montantAffiche = montantManuel ?? (calcule === null ? "" : String(calcule));

  // Taux du jour : récupéré à la bascule en euros (sauf s'il y en a déjà un, en modification).
  useEffect(() => {
    if (devise !== "EUR" || taux !== "") return;
    let actif = true;
    fetch("/api/taux")
      .then((r) => (r.ok ? (r.json() as Promise<Taux>) : null))
      .then((t) => {
        if (actif && t) {
          setTaux(String(t.taux).replace(".", ","));
          setTauxInfo(t);
        }
      })
      .catch(() => {});
    return () => {
      actif = false;
    };
  }, [devise, taux]);

  function basculer(d: "MAD" | "EUR") {
    setDevise(d);
    if (d === "EUR" && pays === "Maroc") setPays("");
    if (d === "MAD" && pays === "") setPays("Maroc");
  }

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    const l = parseNombre(litres);
    const p = parseNombre(prix);
    const t = parseNombre(taux);
    const m = montantManuel !== null ? parseNombre(montantManuel) : null;
    if (!date) return setErreur("Indiquez la date.");
    if (l === null || Number.isNaN(l)) return setErreur("Indiquez le nombre de litres.");
    if (statut !== "offert" && (p === null || Number.isNaN(p)))
      return setErreur("Indiquez le prix au litre.");
    if (devise === "EUR" && (t === null || Number.isNaN(t) || t <= 0))
      return setErreur("Indiquez le taux EUR → DH.");
    if (m !== null && Number.isNaN(m)) return setErreur("Le montant en dirhams est illisible.");
    const corps = {
      date,
      client,
      ville,
      pays,
      litres: l,
      prix_unitaire: p ?? 0,
      devise,
      taux_eur_mad: devise === "EUR" ? t : null,
      montant_dh: m,
      statut,
      mode_encaissement: mode,
      note,
    };
    void (initial
      ? envoyer(`/api/ventes/${initial.id}`, "PUT", corps, "modifie")
      : envoyer("/api/ventes", "POST", corps, "ajoute"));
  }

  const segment = (actif: boolean) =>
    `min-h-12 flex-1 rounded-xl px-4 font-medium ${actif ? "bg-olive text-creme" : "bg-creme text-pierre border border-sauge"}`;
  const l = parseNombre(litres);
  const p = parseNombre(prix);
  const t = parseNombre(taux);

  return (
    <Carte>
      <form onSubmit={soumettre} className="space-y-5" noValidate>
        <fieldset>
          <legend className="mb-1.5 font-medium">Devise du prix</legend>
          <div className="flex gap-2" role="group" aria-label="Devise du prix">
            <button
              type="button"
              aria-pressed={devise === "MAD"}
              className={segment(devise === "MAD")}
              onClick={() => basculer("MAD")}
            >
              DH
            </button>
            <button
              type="button"
              aria-pressed={devise === "EUR"}
              className={segment(devise === "EUR")}
              onClick={() => basculer("EUR")}
            >
              €
            </button>
          </div>
        </fieldset>

        <Champ id="date" label="Date">
          <input
            id="date"
            type="date"
            className={classeInput}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </Champ>
        <Champ id="client" label="Client">
          <input
            id="client"
            className={classeInput}
            value={client}
            onChange={(e) => setClient(e.target.value)}
          />
        </Champ>
        <div className="grid gap-5 sm:grid-cols-2">
          <Champ id="ville" label="Ville">
            <input
              id="ville"
              className={classeInput}
              value={ville}
              onChange={(e) => setVille(e.target.value)}
            />
          </Champ>
          <Champ id="pays" label="Pays">
            <input
              id="pays"
              className={classeInput}
              value={pays}
              onChange={(e) => setPays(e.target.value)}
            />
          </Champ>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Champ id="litres" label="Litres">
            <input
              id="litres"
              inputMode="decimal"
              className={classeInput}
              value={litres}
              onChange={(e) => setLitres(e.target.value)}
              required
            />
          </Champ>
          <Champ id="prix" label={`Prix au litre (${devise === "EUR" ? "€" : "DH"})`}>
            <input
              id="prix"
              inputMode="decimal"
              className={classeInput}
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
            />
          </Champ>
        </div>

        {devise === "EUR" ? (
          <Champ
            id="taux"
            label="Taux du jour (1 € = … DH)"
            aide={
              tauxInfo
                ? `Taux récupéré (${tauxInfo.source}) : vous pouvez le modifier. Il sera figé dans la vente.`
                : "Le taux est figé dans la vente à l'enregistrement."
            }
          >
            <input
              id="taux"
              inputMode="decimal"
              className={classeInput}
              value={taux}
              onChange={(e) => setTaux(e.target.value)}
            />
          </Champ>
        ) : null}

        <Champ
          id="montant"
          label="Montant en DH"
          aide={
            montantManuel !== null
              ? "Montant modifié à la main."
              : devise === "EUR" && l !== null && p !== null && t !== null && calcule !== null
                ? `${formatNombre(l)} L × ${formatNombre(p, 2)} € × ${formatNombre(t, 4)} = ${formatDH(calcule)}`
                : "Calculé automatiquement ; modifiable si besoin."
          }
        >
          <input
            id="montant"
            inputMode="decimal"
            className={classeInput}
            value={montantAffiche}
            onChange={(e) => setMontantManuel(e.target.value)}
          />
          {montantManuel !== null ? (
            <button
              type="button"
              className="min-h-11 text-base text-pierre underline"
              onClick={() => setMontantManuel(null)}
            >
              Revenir au montant calculé
            </button>
          ) : null}
        </Champ>

        <div className="grid gap-5 sm:grid-cols-2">
          <Champ id="statut" label="Statut">
            <select
              id="statut"
              className={classeInput}
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
            >
              {STATUTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Champ>
          <Champ id="mode" label="Mode d'encaissement">
            <select
              id="mode"
              className={classeInput}
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="">Non précisé</option>
              {MODES_PAIEMENT.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Champ>
        </div>
        <Champ id="note" label="Note">
          <input
            id="note"
            className={classeInput}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Champ>

        <BlocErreur message={erreur} />
        <div className="flex flex-wrap items-center gap-3">
          <Bouton type="submit" disabled={envoi}>
            {initial ? "Enregistrer les modifications" : "Ajouter la vente"}
          </Bouton>
          <Bouton variante="secondaire" onClick={() => history.back()}>
            Annuler
          </Bouton>
        </div>
      </form>
      {initial ? (
        <div className="mt-6 border-t border-sauge/40 pt-4">
          <SuppressionConfirmee
            libelle={`Supprimer la vente à « ${initial.client || "ce client"} » ?`}
            desactive={envoi}
            onConfirmer={() =>
              void envoyer(`/api/ventes/${initial.id}`, "DELETE", undefined, "supprime")
            }
          />
        </div>
      ) : null}
    </Carte>
  );
}
