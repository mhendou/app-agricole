"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Carte({
  children,
  className = "",
  ton = "creme",
}: {
  children: ReactNode;
  className?: string;
  ton?: "creme" | "olive" | "sauge";
}) {
  const fond =
    ton === "olive"
      ? "bg-olive-fonce text-creme"
      : ton === "sauge"
        ? "bg-sauge/30 text-encre"
        : "bg-creme text-encre";
  return (
    <section className={`rounded-carte p-5 shadow-carte anim-apparition ${fond} ${className}`}>
      {children}
    </section>
  );
}

export function CarteChiffre({
  titre,
  valeur,
  note,
  couleur = "encre",
  fonce = false,
  icone,
}: {
  titre: string;
  valeur: string;
  note?: ReactNode;
  couleur?: "encre" | "olive" | "argile" | "ocre";
  fonce?: boolean;
  icone?: ReactNode;
}) {
  const classeCouleur = fonce
    ? "text-creme"
    : { encre: "text-encre", olive: "text-olive", argile: "text-argile-texte", ocre: "text-ocre" }[
        couleur
      ];
  return (
    <Carte ton={fonce ? "olive" : "creme"}>
      <div className="flex items-center justify-between gap-2">
        <h3 className={`text-base font-medium ${fonce ? "text-sauge-clair" : "text-pierre"}`}>
          {titre}
        </h3>
        {icone}
      </div>
      <p className={`font-titre mt-2 text-4xl font-semibold ${classeCouleur}`}>{valeur}</p>
      {note ? (
        <p className={`mt-2 text-base ${fonce ? "text-creme/80" : "text-pierre"}`}>{note}</p>
      ) : null}
    </Carte>
  );
}

const tons = {
  olive: "bg-olive/15 text-olive-fonce",
  ocre: "bg-ocre/25 text-[#6b4a00]",
  pierre: "bg-pierre/15 text-pierre",
  argile: "bg-argile/15 text-argile-texte",
  ciel: "bg-ciel/15 text-[#2f5d79]",
} as const;

export function Badge({
  children,
  ton = "pierre",
}: {
  children: ReactNode;
  ton?: keyof typeof tons;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-base font-medium ${tons[ton]}`}
    >
      {children}
    </span>
  );
}

const variantes = {
  primaire: "bg-olive text-creme hover:bg-olive-fonce",
  secondaire: "bg-creme text-olive-fonce border border-sauge hover:bg-sauge/20",
  danger: "bg-argile text-creme hover:brightness-90",
  discret: "bg-transparent text-pierre hover:bg-sauge/20",
} as const;

export function Bouton({
  variante = "primaire",
  className = "",
  children,
  ...props
}: {
  variante?: keyof typeof variantes;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-5 py-2 text-base font-medium transition disabled:opacity-50 ${variantes[variante]} ${className}`}
    >
      {children}
    </button>
  );
}

export function BarreProportion({
  valeur,
  max = 100,
  couleur = "olive",
  libelle,
}: {
  valeur: number;
  max?: number;
  couleur?: "olive" | "argile" | "ocre" | "ciel";
  libelle: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (valeur / max) * 100)) : 0;
  const fond = { olive: "bg-olive", argile: "bg-argile", ocre: "bg-ocre", ciel: "bg-ciel" }[
    couleur
  ];
  return (
    <div
      role="meter"
      aria-label={libelle}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-3 w-full overflow-hidden rounded-full bg-sauge/30"
    >
      <div className={`anim-croissance h-full rounded-full ${fond}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function SelecteurAnnee({
  annee,
  min,
  max,
  onChange,
}: {
  annee: number;
  min: number;
  max: number;
  onChange: (annee: number) => void;
}) {
  const bouton =
    "inline-flex h-11 w-11 items-center justify-center rounded-full bg-creme shadow-carte disabled:opacity-40";
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={bouton}
        aria-label="Année précédente"
        disabled={annee <= min}
        onClick={() => onChange(annee - 1)}
      >
        <ChevronLeft size={20} strokeWidth={1.5} />
      </button>
      <span className="font-titre min-w-16 text-center text-xl font-semibold" aria-live="polite">
        {annee}
      </span>
      <button
        type="button"
        className={bouton}
        aria-label="Année suivante"
        disabled={annee >= max}
        onClick={() => onChange(annee + 1)}
      >
        <ChevronRight size={20} strokeWidth={1.5} />
      </button>
    </div>
  );
}

export function EtatVide({
  titre,
  texte,
  action,
}: {
  titre: string;
  texte?: string;
  action?: ReactNode;
}) {
  return (
    <Carte className="text-center">
      <p className="font-titre text-xl font-semibold">{titre}</p>
      {texte ? <p className="mt-1 text-pierre">{texte}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </Carte>
  );
}

export function Chargement({ libelle = "Chargement…" }: { libelle?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 p-8 text-pierre">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-sauge border-t-olive"
        aria-hidden
      />
      <span>{libelle}</span>
    </div>
  );
}

export function Erreur({
  titre = "Un souci est survenu",
  children,
}: {
  titre?: string;
  children?: ReactNode;
}) {
  return (
    <div role="alert" className="rounded-carte border border-argile/40 bg-argile/10 p-5 text-encre">
      <p className="font-titre text-lg font-semibold text-argile-texte">{titre}</p>
      {children ? <div className="mt-1">{children}</div> : null}
    </div>
  );
}
