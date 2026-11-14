"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Bouton } from "./ui";

export const classeInput =
  "min-h-12 w-full rounded-xl border border-sauge bg-creme px-4 text-base text-encre placeholder:text-pierre/70";

export function Champ({
  id,
  label,
  aide,
  children,
}: {
  id: string;
  label: string;
  aide?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      {children}
      {aide ? <p className="text-base text-pierre">{aide}</p> : null}
    </div>
  );
}

/** Envoi JSON vers une route d'écriture, puis retour à la liste avec un message de succès. */
export function useEnvoi(retour: string) {
  const router = useRouter();
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function envoyer(
    url: string,
    methode: "POST" | "PUT" | "DELETE",
    corps: unknown,
    ok: string,
  ) {
    setEnvoi(true);
    setErreur("");
    try {
      const r = await fetch(url, {
        method: methode,
        headers: { "Content-Type": "application/json" },
        body: corps === undefined ? undefined : JSON.stringify(corps),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { erreur?: string };
        setErreur(j.erreur ?? "L'enregistrement a échoué. Réessayez.");
        setEnvoi(false);
        return;
      }
      const sep = retour.includes("?") ? "&" : "?";
      router.push(`${retour}${sep}ok=${ok}`);
      router.refresh();
    } catch {
      setErreur("Connexion impossible. Vérifiez votre réseau et réessayez.");
      setEnvoi(false);
    }
  }
  return { erreur, envoi, setErreur, envoyer };
}

export function BlocErreur({ message }: { message: string }) {
  return (
    <p role="alert" className="min-h-6 text-base font-medium text-argile">
      {message}
    </p>
  );
}

/** Suppression en deux temps : le bouton demande d'abord une confirmation explicite. */
export function SuppressionConfirmee({
  libelle,
  onConfirmer,
  desactive,
}: {
  libelle: string;
  onConfirmer: () => void;
  desactive?: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  if (!ouvert) {
    return (
      <Bouton variante="discret" className="text-argile" onClick={() => setOuvert(true)}>
        Supprimer
      </Bouton>
    );
  }
  return (
    <div
      role="alertdialog"
      aria-label="Confirmer la suppression"
      className="rounded-2xl border border-argile/40 bg-argile/10 p-4"
    >
      <p className="font-medium">{libelle}</p>
      <p className="text-base text-pierre">Cette action est définitive.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Bouton variante="danger" onClick={onConfirmer} disabled={desactive}>
          Oui, supprimer
        </Bouton>
        <Bouton variante="secondaire" onClick={() => setOuvert(false)}>
          Annuler
        </Bouton>
      </div>
    </div>
  );
}
