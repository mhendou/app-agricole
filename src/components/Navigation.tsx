"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CloudRain, Droplet, House, Leaf, Receipt, ShieldCheck } from "lucide-react";
import type { ComponentType } from "react";

type Entree = {
  href: string;
  libelle: string;
  Icone: ComponentType<{ size?: number; strokeWidth?: number }>;
};

const ENTREES: Entree[] = [
  { href: "/", libelle: "Accueil", Icone: House },
  { href: "/recoltes", libelle: "Récoltes", Icone: Leaf },
  { href: "/ventes", libelle: "Ventes", Icone: Droplet },
  { href: "/depenses", libelle: "Dépenses", Icone: Receipt },
  { href: "/meteo", libelle: "Météo", Icone: CloudRain },
];

const ADMIN: Entree = {
  href: "/admin/controle",
  libelle: "Contrôle des données",
  Icone: ShieldCheck,
};

function useLiens() {
  const pathname = usePathname();
  const annee = useSearchParams().get("annee");
  const suffixe = annee ? `?annee=${encodeURIComponent(annee)}` : "";
  const actif = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return { suffixe, actif };
}

/** Barre d'onglets du bas (mobile et tablette). */
export function BarreOnglets() {
  const { suffixe, actif } = useLiens();
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-sauge bg-creme pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_18px_rgba(42,39,34,0.12)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-xl justify-between px-1">
        {ENTREES.map(({ href, libelle, Icone }) => (
          <li key={href} className="flex-1">
            <Link
              href={`${href}${suffixe}`}
              aria-current={actif(href) ? "page" : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-xl text-sm font-semibold ${
                actif(href) ? "text-olive-fonce" : "text-encre"
              }`}
            >
              <span
                className={`flex h-9 w-16 items-center justify-center rounded-full ${actif(href) ? "bg-olive-fonce text-creme" : "text-olive"}`}
              >
                <Icone size={26} strokeWidth={actif(href) ? 2 : 1.75} />
              </span>
              {libelle}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Menu latéral (ordinateur, ≥ 1024 px). */
export function MenuLateral({ admin }: { admin: boolean }) {
  const { suffixe, actif } = useLiens();
  const entrees = admin ? [...ENTREES, ADMIN] : ENTREES;
  return (
    <nav aria-label="Navigation principale" className="hidden w-64 shrink-0 lg:block">
      <ul className="sticky top-28 space-y-1">
        {entrees.map(({ href, libelle, Icone }) => (
          <li key={href}>
            <Link
              href={href.startsWith("/admin") ? href : `${href}${suffixe}`}
              aria-current={actif(href) ? "page" : undefined}
              className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 text-base font-medium ${
                actif(href) ? "bg-olive-fonce text-creme" : "text-encre hover:bg-sauge/25"
              }`}
            >
              <Icone size={22} strokeWidth={1.5} />
              {libelle}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
