"use client";

import { useState } from "react";
import { Bouton, Carte } from "./ui";
import { BlocErreur, Champ, SuppressionConfirmee, classeInput, useEnvoi } from "./formulaire";
import { parseNombre } from "@/lib/parse";
import { CATEGORIES, MODES_PAIEMENT, type Depense } from "@/lib/types";

export function FormDepense({ initial, aujourdhui }: { initial?: Depense; aujourdhui: string }) {
  const annee = (initial?.date ?? aujourdhui).slice(0, 4);
  const { erreur, envoi, setErreur, envoyer } = useEnvoi(`/depenses?annee=${annee}`);
  const [date, setDate] = useState(initial?.date ?? aujourdhui);
  const [categorie, setCategorie] = useState<string>(initial?.categorie ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [beneficiaire, setBeneficiaire] = useState(initial?.beneficiaire ?? "");
  const [montant, setMontant] = useState(
    initial ? String(initial.montant_dh).replace(".", ",") : "",
  );
  const [mode, setMode] = useState(initial?.mode_paiement ?? "virement");
  const [note, setNote] = useState(initial?.note ?? "");

  function valider() {
    const m = parseNombre(montant);
    if (!date) return "Indiquez la date.";
    if (!categorie) return "Choisissez une catégorie.";
    if (m === null || Number.isNaN(m)) return "Indiquez le montant en dirhams.";
    if (m < 0) return "Le montant ne peut pas être négatif.";
    return "";
  }

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    const probleme = valider();
    if (probleme) return setErreur(probleme);
    const corps = {
      date,
      categorie,
      description,
      beneficiaire,
      montant_dh: parseNombre(montant),
      mode_paiement: mode,
      note,
    };
    void (initial
      ? envoyer(`/api/depenses/${initial.id}`, "PUT", corps, "modifie")
      : envoyer("/api/depenses", "POST", corps, "ajoute"));
  }

  return (
    <Carte>
      <form onSubmit={soumettre} className="space-y-5" noValidate>
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
        <Champ id="categorie" label="Catégorie">
          <select
            id="categorie"
            className={classeInput}
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            required
          >
            <option value="">Choisir…</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Champ>
        <Champ id="montant" label="Montant (DH)">
          <input
            id="montant"
            inputMode="decimal"
            className={classeInput}
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="ex. 910"
            required
          />
        </Champ>
        <Champ id="description" label="Description">
          <input
            id="description"
            className={classeInput}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="ex. Irrigation"
          />
        </Champ>
        <Champ id="beneficiaire" label="Bénéficiaire">
          <input
            id="beneficiaire"
            className={classeInput}
            value={beneficiaire}
            onChange={(e) => setBeneficiaire(e.target.value)}
          />
        </Champ>
        <Champ id="mode" label="Mode de paiement">
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
            {initial ? "Enregistrer les modifications" : "Ajouter la dépense"}
          </Bouton>
          <Bouton variante="secondaire" onClick={() => history.back()}>
            Annuler
          </Bouton>
        </div>
      </form>
      {initial ? (
        <div className="mt-6 border-t border-sauge/40 pt-4">
          <SuppressionConfirmee
            libelle={`Supprimer la dépense « ${initial.description || initial.categorie} » ?`}
            desactive={envoi}
            onConfirmer={() =>
              void envoyer(`/api/depenses/${initial.id}`, "DELETE", undefined, "supprime")
            }
          />
        </div>
      ) : null}
    </Carte>
  );
}
