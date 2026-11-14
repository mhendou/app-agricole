import { Check } from "lucide-react";

const MESSAGES: Record<string, string> = {
  ajoute: "C'est enregistré.",
  modifie: "La modification est enregistrée.",
  supprime: "La ligne a été supprimée.",
};

/** Message de confirmation affiché après une écriture (?ok=ajoute|modifie|supprime). */
export function BandeauSucces({ ok }: { ok: string | string[] | undefined }) {
  const message = typeof ok === "string" ? MESSAGES[ok] : undefined;
  if (!message) return null;
  return (
    <p
      role="status"
      className="flex items-center gap-2 rounded-2xl bg-olive/15 px-4 py-3 font-medium text-olive-fonce"
    >
      <Check size={20} strokeWidth={2} aria-hidden="true" />
      {message}
    </p>
  );
}
