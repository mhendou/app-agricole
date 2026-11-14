/**
 * Taux EUR → MAD : Frankfurter, puis open.er-api.com (attribution requise), puis taux de secours.
 * Cache de 12 h. Le taux est ensuite figé dans la ligne de vente (modifiable par l'admin).
 */
export type TauxEur = {
  taux: number;
  source: "frankfurter" | "open.er-api.com" | "secours";
  /** ISO de l'obtention du taux. */
  date: string;
};

type Fetch = (
  url: string,
  init?: { signal?: AbortSignal },
) => Promise<Pick<Response, "ok" | "json">>;

const DUREE_CACHE_MS = 12 * 3600 * 1000;
const DELAI_MS = 6000;

const URL_FRANKFURTER = "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=MAD";
const URL_ER_API = "https://open.er-api.com/v6/latest/EUR";

let cache: { valeur: TauxEur; a: number } | null = null;

export function viderCacheTaux() {
  cache = null;
}

const tauxValide = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n) && n > 1 && n < 100;

async function appeler(f: Fetch, url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), DELAI_MS);
  try {
    const r = await f(url, { signal: ctrl.signal });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function tauxEurMad(
  secours: number,
  options: { fetch?: Fetch; maintenant?: () => number } = {},
): Promise<TauxEur> {
  const f = options.fetch ?? (globalThis.fetch as Fetch);
  const maintenant = options.maintenant ?? Date.now;
  if (cache && maintenant() - cache.a < DUREE_CACHE_MS) return cache.valeur;

  const resultat = (taux: number, source: TauxEur["source"]): TauxEur => ({
    taux: Math.round(taux * 10000) / 10000,
    source,
    date: new Date(maintenant()).toISOString(),
  });

  const a = (await appeler(f, URL_FRANKFURTER)) as { rates?: { MAD?: number } } | null;
  if (tauxValide(a?.rates?.MAD)) {
    cache = { valeur: resultat(a.rates.MAD, "frankfurter"), a: maintenant() };
    return cache.valeur;
  }
  const b = (await appeler(f, URL_ER_API)) as { result?: string; rates?: { MAD?: number } } | null;
  if (b?.result !== "error" && tauxValide(b?.rates?.MAD)) {
    cache = { valeur: resultat(b.rates.MAD, "open.er-api.com"), a: maintenant() };
    return cache.valeur;
  }
  // Le taux de secours n'est pas mis en cache : on réessaiera les API au prochain appel.
  return resultat(secours, "secours");
}

/** Convertit un montant en euros en DH (arrondi au dirham). */
export const eurVersDh = (eur: number, taux: number) => Math.round(eur * taux);
