const NBSP = " ";

function groupes(n: number): string {
  const ent = Math.abs(n).toFixed(0);
  return ent.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

/** 10680 → « 10 680 DH » (espace insécable). */
export function formatDH(n: number): string {
  const signe = Math.round(n) < 0 ? "-" : "";
  return `${signe}${groupes(Math.round(n))}${NBSP}DH`;
}

export function formatNombre(n: number, decimales = 0): string {
  const fixe = Math.abs(n).toFixed(decimales);
  const [ent, dec] = fixe.split(".");
  const signe = n < 0 && Number(fixe) !== 0 ? "-" : "";
  return signe + ent.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) + (dec ? `,${dec}` : "");
}

export const formatKg = (n: number) => `${formatNombre(n)}${NBSP}kg`;
export const formatLitres = (n: number) => `${formatNombre(n)}${NBSP}L`;
export const formatPct = (n: number, decimales = 1) => `${formatNombre(n, decimales)}${NBSP}%`;
export const formatMm = (n: number) => `${formatNombre(n, n % 1 === 0 ? 0 : 1)}${NBSP}mm`;

const MOIS_COURTS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];
const MOIS_LONGS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export const nomMois = (m: number, court = false) => (court ? MOIS_COURTS : MOIS_LONGS)[m - 1];

/** « 2026-04-13 » → « 13 avr. 2026 ». */
export function formatDate(iso: string): string {
  const [a, m, j] = iso.split("-").map(Number);
  return `${j}${NBSP}${MOIS_COURTS[m - 1]}${NBSP}${a}`;
}

/** Signe explicite pour les écarts : « +12 % », « −8 % ». */
export function formatEcart(n: number, unite: "pct" | "kg"): string {
  const signe = n > 0 ? "+" : n < 0 ? "−" : "";
  const abs = Math.abs(n);
  return unite === "pct" ? `${signe}${formatNombre(abs, 0)}${NBSP}%` : `${signe}${formatKg(abs)}`;
}
