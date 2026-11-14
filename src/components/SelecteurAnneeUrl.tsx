"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  const brut = Number(params.get("annee"));
  const annee = Number.isInteger(brut) && brut >= min && brut <= max ? brut : courante;
  return (
    <SelecteurAnnee
      annee={annee}
      min={min}
      max={max}
      onChange={(a) => {
        const p = new URLSearchParams(params.toString());
        p.set("annee", String(a));
        router.push(`${pathname}?${p.toString()}`);
      }}
    />
  );
}
