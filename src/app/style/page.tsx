"use client";

import { useState } from "react";
import {
  BarreProportion,
  Badge,
  Bouton,
  Carte,
  CarteChiffre,
  Chargement,
  EtatVide,
  Erreur,
  SelecteurAnnee,
} from "@/components/ui";

export default function Page() {
  const [annee, setAnnee] = useState(2026);
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-5">
      <h1 className="font-titre text-3xl font-semibold text-olive-fonce">Guide de style</h1>
      <SelecteurAnnee annee={annee} min={2013} max={2026} onChange={setAnnee} />
      <div className="grid gap-4 sm:grid-cols-3">
        <CarteChiffre titre="Ventes encaissées" valeur="10 680 DH" couleur="olive" />
        <CarteChiffre titre="Dépenses" valeur="8 631 DH" couleur="argile" />
        <CarteChiffre titre="Solde" valeur="2 049 DH" fonce note="Solde de trésorerie de l'année" />
      </div>
      <Carte>
        <div className="flex flex-wrap gap-2">
          <Badge ton="olive">payé</Badge>
          <Badge ton="ocre">à encaisser</Badge>
          <Badge ton="pierre">offert</Badge>
          <Badge ton="ciel">pluie</Badge>
          <Badge ton="argile">à vérifier</Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Bouton>Primaire</Bouton>
          <Bouton variante="secondaire">Secondaire</Bouton>
          <Bouton variante="danger">Supprimer</Bouton>
          <Bouton variante="discret">Discret</Bouton>
        </div>
        <div className="mt-4">
          <BarreProportion valeur={81} libelle="Dépenses par rapport aux ventes" couleur="argile" />
        </div>
      </Carte>
      <EtatVide titre="Rien à afficher" texte="Aucune donnée pour cette année." />
      <Chargement />
      <Erreur>Impossible de lire les données.</Erreur>
    </main>
  );
}
