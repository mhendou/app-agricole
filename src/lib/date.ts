const FUSEAU = "Africa/Casablanca";

/** Date du jour (AAAA-MM-JJ) à Casablanca. */
export function aujourdhui(maintenant: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSEAU,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(maintenant);
}

export function anneeCourante(maintenant: Date = new Date()): number {
  return Number(aujourdhui(maintenant).slice(0, 4));
}

/** Ajoute (ou retire) des jours à une date AAAA-MM-JJ. */
export function ajouterJours(iso: string, n: number): string {
  const [a, m, j] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(a, m - 1, j + n));
  return t.toISOString().slice(0, 10);
}
