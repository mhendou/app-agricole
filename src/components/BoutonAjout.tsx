import Link from "next/link";
import { Plus } from "lucide-react";

/** Bouton « + » réservé à l'administrateur (affiché uniquement côté serveur pour l'admin). */
export function BoutonAjout({ href, libelle }: { href: string; libelle: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-olive px-4 py-2 text-base font-medium text-creme hover:bg-olive-fonce"
    >
      <Plus size={20} strokeWidth={1.75} aria-hidden="true" />
      {libelle}
    </Link>
  );
}
