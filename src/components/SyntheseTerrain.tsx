import { Ruler, TreeDeciduous, Sprout } from "lucide-react";
import { SUPERFICIE_HA, VARIETE } from "@/lib/terrain";

/** Rappel du terrain : superficie, nombre d'oliviers, variété. */
export function SyntheseTerrain({
  nbOliviers,
  variante = "carte",
}: {
  nbOliviers: number;
  variante?: "carte" | "discret";
}) {
  const elements = [
    { Icone: Ruler, texte: `${SUPERFICIE_HA.toLocaleString("fr-FR", { minimumFractionDigits: 1 })} hectares` },
    { Icone: TreeDeciduous, texte: `${nbOliviers} oliviers` },
    { Icone: Sprout, texte: VARIETE },
  ];
  if (variante === "discret") {
    return (
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-pierre">
        {elements.map(({ Icone, texte }) => (
          <span key={texte} className="inline-flex items-center gap-1">
            <Icone size={14} strokeWidth={1.5} aria-hidden="true" />
            {texte}
          </span>
        ))}
      </p>
    );
  }
  return (
    <ul
      aria-label="Notre terrain"
      className="flex flex-wrap gap-2 rounded-carte bg-sauge/25 p-3 text-base text-olive-fonce"
    >
      {elements.map(({ Icone, texte }) => (
        <li key={texte} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-creme px-3">
          <Icone size={18} strokeWidth={1.5} className="text-olive" aria-hidden="true" />
          {texte}
        </li>
      ))}
    </ul>
  );
}
