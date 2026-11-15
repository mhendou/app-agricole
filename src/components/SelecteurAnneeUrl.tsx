"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ANNEE_DEBUT_ACCUEIL } from "@/lib/annee";
import { SelecteurAnnee } from "./ui";

/** Sélecteur d'année relié à l'URL (?annee=). */
export function SelecteurAnneeUrl({
  min,
  max,
  courante,
}: {
  min: number;
  max: number;
  courante: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // L'accueil démarre en 2026 ; l'historique reste consultable dans les autres écrans.
  const minEcran = pathname === "/" ? Math.min(Math.max(min, ANNEE_DEBUT_ACCUEIL), max) : min;
  const brut = Number(params.get("annee"));
  const annee = Number.isInteger(brut) && brut >= minEcran && brut <= max ? brut : courante;
  return (
    <SelecteurAnnee
      annee={annee}
      min={minEcran}
      max={max}
      onChange={(a) => {
        const p = new URLSearchParams(params.toString());
        p.set("annee", String(a));
        router.push(`${pathname}?${p.toString()}`);
      }}
    />
  );
}
