import type { ZodType } from "zod";
import {
  DepenseSchema,
  PARAMETRES_DEFAUT,
  PluieSchema,
  RecolteSchema,
  VenteSchema,
  type Depense,
  type LigneInvalide,
  type Parametres,
  type Pluie,
  type Recolte,
  type TableNom,
  type Vente,
} from "./types";

export type Cellule = string | number | boolean | null | undefined;

/** Minuscules, sans accents ni espaces superflus : « Montant_DH » → « montant_dh ». */
export function normaliserEntete(s: unknown): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function estVide(v: Cellule): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

/** Nombre tolérant : « 1 234,5 », « 910 DH », 910, « 12,5 € ». Renvoie null si vide, NaN si illisible. */
export function parseNombre(v: Cellule): number | null {
  if (estVide(v)) return null;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return Number.NaN;
  let s = String(v)
    .replace(/[  \s]/g, "")
    .replace(/(dh|mad|€|eur|kg|l|mm|°c|%)$/i, "")
    .trim();
  if (s.includes(",") && s.includes(".")) {
    // « 1.234,56 » (européen) ou « 1,234.56 » (anglo-saxon)
    s =
      s.lastIndexOf(",") > s.lastIndexOf(".")
        ? s.replace(/\./g, "").replace(",", ".")
        : s.replace(/,/g, "");
  } else {
    s = s.replace(",", ".");
  }
  if (!/^[-+]?\d+(\.\d+)?$/.test(s)) return Number.NaN;
  return Number(s);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function dateValide(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2200) return null;
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Numéro de série Google Sheets / Excel → AAAA-MM-JJ (origine 30/12/1899). */
export function dateDepuisSerie(n: number): string | null {
  if (!Number.isFinite(n) || n < 1 || n > 100000) return null;
  const t = new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 86400000);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

const MOIS_FR: Record<string, number> = {
  janv: 1,
  janvier: 1,
  fevr: 2,
  fev: 2,
  fevrier: 2,
  mars: 3,
  avr: 4,
  avril: 4,
  mai: 5,
  juin: 6,
  juil: 7,
  juillet: 7,
  aout: 8,
  sept: 9,
  septembre: 9,
  oct: 10,
  octobre: 10,
  nov: 11,
  novembre: 11,
  dec: 12,
  decembre: 12,
};

/** Date tolérante : série, AAAA-MM-JJ, JJ/MM/AAAA, « 13 avr. 2026 ». Renvoie null si vide ou illisible. */
export function parseDate(v: Cellule): string | null {
  if (estVide(v)) return null;
  if (typeof v === "number") return dateDepuisSerie(v);
  if (typeof v !== "string") return null;
  const s = v.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (m) return dateValide(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (m) return dateValide(+m[3], +m[2], +m[1]);
  m = s.match(/^(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\.?\s+(\d{4})$/);
  if (m) {
    const mois = MOIS_FR[normaliserEntete(m[2])];
    if (mois) return dateValide(+m[3], mois, +m[1]);
  }
  if (/^\d+(\.\d+)?$/.test(s)) return dateDepuisSerie(Number(s));
  return null;
}

export function texte(v: Cellule): string {
  return estVide(v) ? "" : String(v).trim();
}

export type Resultat<T> = { lignes: T[]; invalides: LigneInvalide[] };

type Objet = Record<string, Cellule>;

/** Transforme un tableau (ligne 0 = en-têtes) en objets indexés par nom de colonne normalisé. */
export function tableauVersObjets(rows: Cellule[][]): { objets: { ligne: number; o: Objet }[] } {
  if (rows.length === 0) return { objets: [] };
  const entetes = rows[0].map(normaliserEntete);
  const objets: { ligne: number; o: Objet }[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] ?? [];
    if (r.every(estVide)) continue;
    const o: Objet = {};
    entetes.forEach((h, j) => {
      if (h) o[h] = r[j];
    });
    objets.push({ ligne: i + 1, o });
  }
  return { objets };
}

function zodMessage(err: { issues: { path: PropertyKey[]; message: string }[] }): string {
  return err.issues.map((i) => `${String(i.path[0] ?? "ligne")} : ${i.message}`).join(" ; ");
}

function construire<T>(
  onglet: TableNom,
  rows: Cellule[][],
  schema: ZodType<T>,
  convertir: (o: Objet, ligne: number) => unknown,
): Resultat<T> {
  const lignes: T[] = [];
  const invalides: LigneInvalide[] = [];
  for (const { ligne, o } of tableauVersObjets(rows).objets) {
    try {
      const brut = convertir(o, ligne);
      const r = schema.safeParse(brut);
      if (r.success) lignes.push(r.data);
      else invalides.push({ onglet, ligne, message: zodMessage(r.error) });
    } catch (e) {
      invalides.push({
        onglet,
        ligne,
        message: e instanceof Error ? e.message : "ligne illisible",
      });
    }
  }
  return { lignes, invalides };
}

function nombreOuErreur(o: Objet, cle: string, requis = false): number | null {
  const n = parseNombre(o[cle]);
  if (n !== null && Number.isNaN(n))
    throw new Error(`${cle} : nombre illisible (« ${String(o[cle])} »)`);
  if (n === null && requis) throw new Error(`${cle} manquant`);
  return n;
}

function dateOuErreur(o: Objet, cle: string, requis = true): string | null {
  const d = parseDate(o[cle]);
  if (d === null && (requis || !estVide(o[cle]))) {
    throw new Error(
      estVide(o[cle]) ? `${cle} manquante` : `${cle} illisible (« ${String(o[cle])} »)`,
    );
  }
  return d;
}

export function parseDepenses(rows: Cellule[][]): Resultat<Depense> {
  return construire("Depenses", rows, DepenseSchema, (o, ligne) => ({
    id: texte(o.id) || `ligne-${ligne}`,
    date: dateOuErreur(o, "date"),
    categorie: texte(o.categorie),
    description: texte(o.description),
    beneficiaire: texte(o.beneficiaire),
    montant_dh: nombreOuErreur(o, "montant_dh", true),
    mode_paiement: texte(o.mode_paiement),
    note: texte(o.note),
  }));
}

const normStatut = (s: string): string => {
  const n = normaliserEntete(s);
  if (n === "paye" || n === "payee") return "payé";
  if (n === "a_encaisser") return "à encaisser";
  if (n === "offert" || n === "offerte") return "offert";
  return s.trim();
};

export function parseVentes(rows: Cellule[][]): Resultat<Vente> {
  return construire("Ventes", rows, VenteSchema, (o, ligne) => {
    const devise = (texte(o.devise) || "MAD").toUpperCase();
    const litres = nombreOuErreur(o, "litres", true);
    const prix = nombreOuErreur(o, "prix_unitaire") ?? 0;
    const taux = nombreOuErreur(o, "taux_eur_mad");
    let montant = nombreOuErreur(o, "montant_dh");
    const statut = normStatut(texte(o.statut) || "payé");
    if (montant === null) {
      if (statut === "offert") montant = 0;
      else if (devise === "EUR") {
        if (!taux) throw new Error("taux_eur_mad manquant pour une vente en EUR");
        montant = Math.round((litres ?? 0) * prix * taux);
      } else montant = Math.round((litres ?? 0) * prix);
    }
    return {
      id: texte(o.id) || `ligne-${ligne}`,
      date: dateOuErreur(o, "date"),
      client: texte(o.client),
      ville: texte(o.ville),
      pays: texte(o.pays) || "Maroc",
      litres,
      prix_unitaire: prix,
      devise,
      taux_eur_mad: taux,
      montant_dh: montant,
      statut,
      mode_encaissement: texte(o.mode_encaissement),
      note: texte(o.note),
    };
  });
}

export function parseRecoltes(rows: Cellule[][]): Resultat<Recolte> {
  return construire("Recoltes", rows, RecolteSchema, (o) => ({
    annee_recolte: nombreOuErreur(o, "annee_recolte", true),
    kg_olives: nombreOuErreur(o, "kg_olives"),
    litres_huile: nombreOuErreur(o, "litres_huile"),
    date_recolte: dateOuErreur(o, "date_recolte", false),
    note: texte(o.note),
  }));
}

export function parsePluie(rows: Cellule[][]): Resultat<Pluie> {
  return construire("Pluie", rows, PluieSchema, (o) => ({
    date: dateOuErreur(o, "date"),
    pluie_mm: nombreOuErreur(o, "pluie_mm"),
    temp_max: nombreOuErreur(o, "temp_max"),
    temp_min: nombreOuErreur(o, "temp_min"),
    source: texte(o.source),
    pluie_mm_mesuree: nombreOuErreur(o, "pluie_mm_mesuree"),
  }));
}

/** Pluie retenue pour un jour : le relevé manuel prime sur la donnée modélisée. */
export function pluieRetenue(p: Pluie): number {
  return p.pluie_mm_mesuree ?? p.pluie_mm ?? 0;
}

/** Parametres : tableau clé / valeur. Les clés absentes ou illisibles prennent la valeur par défaut. */
export function parseParametres(rows: Cellule[][]): Parametres {
  const p: Parametres = { ...PARAMETRES_DEFAUT };
  for (const r of rows.slice(1)) {
    const cle = normaliserEntete(r?.[0]);
    const val = r?.[1];
    if (!cle || estVide(val)) continue;
    switch (cle) {
      case "nb_oliviers":
      case "latitude":
      case "longitude":
      case "taux_secours_eur_mad": {
        const n = parseNombre(val);
        if (n !== null && Number.isFinite(n)) p[cle] = n;
        break;
      }
      case "nom_exploitation":
      case "lien_meteoblue":
        p[cle] = texte(val);
        break;
    }
  }
  return p;
}
