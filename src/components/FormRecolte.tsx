"use client";

import { useState } from "react";
import { Bouton, Carte } from "./ui";
import { BlocErreur, Champ, SuppressionConfirmee, classeInput, useEnvoi } from "./formulaire";
import { parseNombre } from "@/lib/parse";
import type { Recolte } from "@/lib/types";

const num = (n: number | null | undefined) =>
  n === null || n === undefined ? "" : String(n).replace(".", ",");

export function FormRecolte({
  initial,
  anneeParDefaut,
}: {
  initial?: Recolte;
  anneeParDefaut: number;
}) {
  const { erreur, envoi, setErreur, envoyer } = useEnvoi("/recoltes");
  const [annee, setAnnee] = useState(String(initial?.annee_recolte ?? anneeParDefaut));
  const [perdue, setPerdue] = useState(initial ? initial.kg_olives === null : false);
  const [kg, setKg] = useState(num(initial?.kg_olives));
  const [litres, setLitres] = useState(num(initial?.litres_huile));
  const [dateRecolte, setDateRecolte] = useState(initial?.date_recolte ?? "");
  const [note, setNote] = useState(initial?.note ?? "");

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    const a = Number(annee);
    const k = parseNombre(kg);
    const l = parseNombre(litres);
    if (!Number.isInteger(a) || a < 1990 || a > 2100)
      return setErreur("Indiquez une année valide.");
    if (!perdue && (k === null || Number.isNaN(k))) {
      return setErreur("Indiquez les kilos d'olives, ou cochez « Donnée perdue ».");
    }
    if (l !== null && Number.isNaN(l)) return setErreur("Les litres d'huile sont illisibles.");
    void envoyer(
      "/api/recoltes",
      "PUT",
      {
        annee_recolte: a,
        kg_olives: perdue ? null : k,
        litres_huile: l,
        date_recolte: dateRecolte || null,
        note,
      },
      initial ? "modifie" : "ajoute",
    );
  }

  return (
    <Carte>
      <form onSubmit={soumettre} className="space-y-5" noValidate>
        <Champ
          id="annee"
          label="Année de récolte"
          aide="Une récolte faite en janvier 2026 est la « Récolte 2025 »."
        >
          <input
            id="annee"
            inputMode="numeric"
            className={classeInput}
            value={annee}
            onChange={(e) => setAnnee(e.target.value)}
            readOnly={!!initial}
          />
        </Champ>

        <label className="flex min-h-11 items-center gap-3">
          <input
            type="checkbox"
            className="h-6 w-6 accent-olive"
            checked={perdue}
            onChange={(e) => setPerdue(e.target.checked)}
          />
          Donnée perdue (kilos inconnus)
        </label>

        <Champ id="kg" label="Olives récoltées (kg)" aide="0 = pas de récolte cette année-là.">
          <input
            id="kg"
            inputMode="decimal"
            className={`${classeInput} disabled:opacity-50`}
            value={perdue ? "" : kg}
            onChange={(e) => setKg(e.target.value)}
            disabled={perdue}
          />
        </Champ>
        <Champ id="litres" label="Huile (litres)" aide="Facultatif.">
          <input
            id="litres"
            inputMode="decimal"
            className={classeInput}
            value={litres}
            onChange={(e) => setLitres(e.target.value)}
          />
        </Champ>
        <Champ id="date-recolte" label="Date de la récolte" aide="Facultatif.">
          <input
            id="date-recolte"
            type="date"
            className={classeInput}
            value={dateRecolte}
            onChange={(e) => setDateRecolte(e.target.value)}
          />
        </Champ>
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
            {initial ? "Enregistrer les modifications" : "Enregistrer la récolte"}
          </Bouton>
          <Bouton variante="secondaire" onClick={() => history.back()}>
            Annuler
          </Bouton>
        </div>
      </form>
      {initial ? (
        <div className="mt-6 border-t border-sauge/40 pt-4">
          <SuppressionConfirmee
            libelle={`Supprimer la récolte ${initial.annee_recolte} ?`}
            desactive={envoi}
            onConfirmer={() =>
              void envoyer(
                `/api/recoltes/${initial.annee_recolte}`,
                "DELETE",
                undefined,
                "supprime",
              )
            }
          />
        </div>
      ) : null}
    </Carte>
  );
}
