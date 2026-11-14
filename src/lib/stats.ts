import { pluieRetenue } from "./parse";
import type { Depense, Donnees, Pluie, Recolte, Vente } from "./types";

const anneeDe = (iso: string) => Number(iso.slice(0, 4));
const moisDe = (iso: string) => Number(iso.slice(5, 7));
const somme = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export type StatsAnnee = {
  annee: number;
  ventesEncaissees: number;
  aEncaisser: number;
  depenses: number;
  solde: number;
  /** Litres vendus (payés + à encaisser), hors litres offerts. */
  litresVendus: number;
  litresOfferts: number;
  /** (encaissé + à encaisser) ÷ litres vendus ; null s'il n'y a aucune vente. */
  prixMoyenLitre: number | null;
  /** dépenses ÷ ventes encaissées, en pourcentage ; null sans vente encaissée. */
  depensesPctVentes: number | null;
  depensesParCategorie: { categorie: string; total: number }[];
  parMois: { mois: number; ventes: number; depenses: number }[];
  repartition: {
    maroc: { litres: number; montant: number };
    horsMaroc: { litres: number; montant: number };
  };
};

const estMaroc = (v: Vente) => v.pays.trim().toLowerCase() === "maroc";

export function statsAnnee(d: Pick<Donnees, "depenses" | "ventes">, annee: number): StatsAnnee {
  const deps = d.depenses.filter((x) => anneeDe(x.date) === annee);
  const vens = d.ventes.filter((x) => anneeDe(x.date) === annee);
  const payees = vens.filter((v) => v.statut === "payé");
  const attente = vens.filter((v) => v.statut === "à encaisser");
  const offertes = vens.filter((v) => v.statut === "offert");
  const vendues = [...payees, ...attente];

  const ventesEncaissees = somme(payees.map((v) => v.montant_dh));
  const aEncaisser = somme(attente.map((v) => v.montant_dh));
  const depenses = somme(deps.map((x) => x.montant_dh));
  const litresVendus = somme(vendues.map((v) => v.litres));

  const parCat = new Map<string, number>();
  for (const x of deps) parCat.set(x.categorie, (parCat.get(x.categorie) ?? 0) + x.montant_dh);

  const parMois = Array.from({ length: 12 }, (_, i) => ({
    mois: i + 1,
    ventes: somme(payees.filter((v) => moisDe(v.date) === i + 1).map((v) => v.montant_dh)),
    depenses: somme(deps.filter((x) => moisDe(x.date) === i + 1).map((x) => x.montant_dh)),
  }));

  const rep = (l: Vente[]) => ({
    litres: somme(l.map((v) => v.litres)),
    montant: somme(l.map((v) => v.montant_dh)),
  });

  return {
    annee,
    ventesEncaissees,
    aEncaisser,
    depenses,
    solde: ventesEncaissees - depenses,
    litresVendus,
    litresOfferts: somme(offertes.map((v) => v.litres)),
    prixMoyenLitre: litresVendus > 0 ? (ventesEncaissees + aEncaisser) / litresVendus : null,
    depensesPctVentes: ventesEncaissees > 0 ? (depenses / ventesEncaissees) * 100 : null,
    depensesParCategorie: [...parCat.entries()]
      .map(([categorie, total]) => ({ categorie, total }))
      .sort((a, b) => b.total - a.total),
    parMois,
    repartition: {
      maroc: rep(vendues.filter(estMaroc)),
      horsMaroc: rep(vendues.filter((v) => !estMaroc(v))),
    },
  };
}

export type StatsRecolte = {
  annee: number;
  /** null = donnée perdue ; 0 = pas de récolte. */
  kg: number | null;
  litres: number | null;
  rendementPct: number | null;
  kgParArbre: number | null;
  /** Écart de kg vs l'année précédente (null si l'une des deux années est perdue). */
  ecartKg: number | null;
  ecartPct: number | null;
  perdue: boolean;
  note: string;
};

export type StatsRecoltes = {
  annees: StatsRecolte[];
  moyenneKg: number | null;
  record: { annee: number; kg: number } | null;
  /** Rendement global (litres ÷ kg) sur les années où les deux sont connus. */
  rendementMoyenPct: number | null;
  kgParArbreMoyen: number | null;
  derniere: StatsRecolte | null;
};

export function statsRecoltes(recoltes: Recolte[], nbOliviers: number): StatsRecoltes {
  const tri = [...recoltes].sort((a, b) => a.annee_recolte - b.annee_recolte);
  const parAnnee = new Map(tri.map((r) => [r.annee_recolte, r]));
  const annees: StatsRecolte[] = tri.map((r) => {
    const kg = r.kg_olives;
    const prec = parAnnee.get(r.annee_recolte - 1)?.kg_olives ?? null;
    const ecartKg = kg !== null && prec !== null ? kg - prec : null;
    return {
      annee: r.annee_recolte,
      kg,
      litres: r.litres_huile,
      rendementPct:
        kg !== null && kg > 0 && r.litres_huile !== null ? (r.litres_huile / kg) * 100 : null,
      kgParArbre: kg !== null && nbOliviers > 0 ? kg / nbOliviers : null,
      ecartKg,
      ecartPct: ecartKg !== null && prec !== null && prec > 0 ? (ecartKg / prec) * 100 : null,
      perdue: kg === null,
      note: r.note,
    };
  });

  const connues = annees.filter((a) => a.kg !== null) as (StatsRecolte & { kg: number })[];
  const moyenneKg = connues.length > 0 ? somme(connues.map((a) => a.kg)) / connues.length : null;
  const best = connues.reduce<(typeof connues)[number] | null>(
    (m, a) => (m === null || a.kg > m.kg ? a : m),
    null,
  );
  const avecHuile = connues.filter((a) => a.kg > 0 && a.litres !== null);
  const kgHuile = somme(avecHuile.map((a) => a.kg));

  return {
    annees,
    moyenneKg,
    record: best ? { annee: best.annee, kg: best.kg } : null,
    rendementMoyenPct:
      kgHuile > 0 ? (somme(avecHuile.map((a) => a.litres ?? 0)) / kgHuile) * 100 : null,
    kgParArbreMoyen: moyenneKg !== null && nbOliviers > 0 ? moyenneKg / nbOliviers : null,
    derniere: connues.length > 0 ? connues[connues.length - 1] : null,
  };
}

/** Rang (1 = meilleure) d'une année parmi les années à donnée connue. */
export function rangRecolte(recoltes: Recolte[], annee: number): number | null {
  const kg = recoltes.find((r) => r.annee_recolte === annee)?.kg_olives;
  if (kg === null || kg === undefined) return null;
  const meilleures = recoltes.filter((r) => r.kg_olives !== null && r.kg_olives > kg).length;
  return meilleures + 1;
}

export type PluieMois = { mois: number; mm: number; joursPluie: number };

/** Pluie par mois d'une année (le relevé mesuré prime sur le modélisé). */
export function pluieParMois(pluie: Pluie[], annee: number): PluieMois[] {
  const mois: PluieMois[] = Array.from({ length: 12 }, (_, i) => ({
    mois: i + 1,
    mm: 0,
    joursPluie: 0,
  }));
  for (const p of pluie) {
    if (anneeDe(p.date) !== annee) continue;
    const mm = pluieRetenue(p);
    const m = mois[moisDe(p.date) - 1];
    m.mm += mm;
    if (mm >= 1) m.joursPluie++;
  }
  return mois.map((m) => ({ ...m, mm: Math.round(m.mm * 10) / 10 }));
}

export function pluieAnnee(pluie: Pluie[], annee: number): number {
  return Math.round(somme(pluieParMois(pluie, annee).map((m) => m.mm)) * 10) / 10;
}

/** Années où l'on a au moins un relevé de pluie, avec leur cumul. */
export function pluieParAnnee(pluie: Pluie[]): { annee: number; mm: number }[] {
  const annees = [...new Set(pluie.map((p) => anneeDe(p.date)))].sort();
  return annees.map((annee) => ({ annee, mm: pluieAnnee(pluie, annee) }));
}

/** Années proposées dans le sélecteur : de la première donnée à l'année en cours. */
export function anneesDisponibles(
  d: Pick<Donnees, "depenses" | "ventes">,
  anneeCourante: number,
): { min: number; max: number } {
  const annees = [
    ...d.depenses.map((x: Depense) => anneeDe(x.date)),
    ...d.ventes.map((x) => anneeDe(x.date)),
  ];
  return { min: Math.min(anneeCourante, ...annees), max: anneeCourante };
}
