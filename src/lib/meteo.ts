/**
 * Open-Meteo (gratuit, sans clé, usage non commercial) — attribution « Open-Meteo.com » obligatoire.
 * Historique : archive-api.open-meteo.com/v1/archive ; prévision : api.open-meteo.com/v1/forecast.
 */
import { ajouterJours } from "./date";
import type { Pluie } from "./types";

type Fetch = (
  url: string,
  init?: { signal?: AbortSignal },
) => Promise<Pick<Response, "ok" | "json" | "status">>;

export const ATTRIBUTION_METEO = "Données modélisées Open-Meteo.com";
export const PREMIER_JOUR = "2013-01-01";
const FUSEAU = "Africa/Casablanca";
const DELAI_MS = 20000;

type Quotidien = {
  time?: string[];
  precipitation_sum?: (number | null)[];
  temperature_2m_max?: (number | null)[];
  temperature_2m_min?: (number | null)[];
  precipitation_probability_max?: (number | null)[];
};

async function appeler(f: Fetch, url: string): Promise<{ daily?: Quotidien }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), DELAI_MS);
  try {
    const r = await f(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`Open-Meteo a répondu ${r.status}`);
    return (await r.json()) as { daily?: Quotidien };
  } finally {
    clearTimeout(t);
  }
}

const arrondi = (n: number | null | undefined) =>
  n === null || n === undefined ? null : Math.round(n * 10) / 10;

export function urlHistorique(lat: number, lon: number, debut: string, fin: string): string {
  const p = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    start_date: debut,
    end_date: fin,
    daily: "precipitation_sum,temperature_2m_max,temperature_2m_min",
    timezone: FUSEAU,
  });
  return `https://archive-api.open-meteo.com/v1/archive?${p}`;
}

/** Relevés quotidiens modélisés entre deux dates ; les jours encore sans valeur sont ignorés. */
export async function recupererHistorique(
  lat: number,
  lon: number,
  debut: string,
  fin: string,
  f: Fetch = globalThis.fetch as Fetch,
): Promise<Pluie[]> {
  if (debut > fin) return [];
  const j = (await appeler(f, urlHistorique(lat, lon, debut, fin))).daily;
  const jours = j?.time ?? [];
  const lignes: Pluie[] = [];
  jours.forEach((date, i) => {
    const mm = j?.precipitation_sum?.[i];
    if (mm === null || mm === undefined) return; // donnée pas encore disponible
    lignes.push({
      date,
      pluie_mm: arrondi(mm),
      temp_max: arrondi(j?.temperature_2m_max?.[i]),
      temp_min: arrondi(j?.temperature_2m_min?.[i]),
      source: "open-meteo",
      pluie_mm_mesuree: null,
    });
  });
  return lignes;
}

export type JourPrevision = {
  date: string;
  pluie_mm: number;
  probabilite: number | null;
  temp_max: number | null;
  temp_min: number | null;
};

let cachePrevision: { cle: string; a: number; v: JourPrevision[] } | null = null;

export async function prevision7j(
  lat: number,
  lon: number,
  f: Fetch = globalThis.fetch as Fetch,
  maintenant: () => number = Date.now,
): Promise<JourPrevision[]> {
  const cle = `${lat},${lon}`;
  if (cachePrevision && cachePrevision.cle === cle && maintenant() - cachePrevision.a < 3600_000) {
    return cachePrevision.v;
  }
  const p = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: "precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min",
    forecast_days: "7",
    timezone: FUSEAU,
  });
  const d = (await appeler(f, `https://api.open-meteo.com/v1/forecast?${p}`)).daily;
  const v: JourPrevision[] = (d?.time ?? []).map((date, i) => ({
    date,
    pluie_mm: arrondi(d?.precipitation_sum?.[i]) ?? 0,
    probabilite: d?.precipitation_probability_max?.[i] ?? null,
    temp_max: arrondi(d?.temperature_2m_max?.[i]),
    temp_min: arrondi(d?.temperature_2m_min?.[i]),
  }));
  cachePrevision = { cle, a: maintenant(), v };
  return v;
}

/** Années civiles entières (ou partielles) à interroger, de `debut` à `fin`. */
export function decouperParAnnee(debut: string, fin: string): { debut: string; fin: string }[] {
  const tranches: { debut: string; fin: string }[] = [];
  let d = debut;
  while (d <= fin) {
    const finAnnee = `${d.slice(0, 4)}-12-31`;
    const f = finAnnee < fin ? finAnnee : fin;
    tranches.push({ debut: d, fin: f });
    d = ajouterJours(f, 1);
  }
  return tranches;
}
