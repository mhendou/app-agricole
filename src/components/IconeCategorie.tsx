import {
  Droplets,
  Ellipsis,
  Package,
  PawPrint,
  Sprout,
  Users,
  Waves,
  Wheat,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const ICONES: Record<string, LucideIcon> = {
  Irrigation: Droplets,
  "Facture d'eau": Waves,
  "Main-d'œuvre": Users,
  "Engrais & intrants": Sprout,
  "Récolte & moulin": Wheat,
  Conditionnement: Package,
  "Gardiennage & animaux": PawPrint,
  "Matériel & entretien": Wrench,
  Autre: Ellipsis,
};

export function IconeCategorie({ categorie, taille = 22 }: { categorie: string; taille?: number }) {
  const Icone = ICONES[categorie] ?? Ellipsis;
  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-argile/10 text-argile"
    >
      <Icone size={taille} strokeWidth={1.5} />
    </span>
  );
}
