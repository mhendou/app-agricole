import type { Donnees, LigneInvalide, TableNom } from "./types";

export type Alerte = {
  onglet: TableNom;
  id: string;
  message: string;
};

export type ResultatControle = {
  invalides: LigneInvalide[];
  aVerifier: Alerte[];
  incoherences: Alerte[];
  doublons: Alerte[];
  total: number;
};

/** Contrôle des données : lignes illisibles, notes « à vérifier », montants incohérents, doublons probables. */
export function controlerDonnees(d: Donnees): ResultatControle {
  const aVerifier: Alerte[] = [];
  for (const x of d.depenses) {
    if (/v[ée]rifier/i.test(x.note))
      aVerifier.push({
        onglet: "Depenses",
        id: x.id,
        message: `${x.description || x.categorie} (${x.date}) : ${x.note}`,
      });
  }
  for (const x of d.ventes) {
    if (/v[ée]rifier/i.test(x.note))
      aVerifier.push({
        onglet: "Ventes",
        id: x.id,
        message: `${x.client || "Vente"} (${x.date}) : ${x.note}`,
      });
  }
  for (const x of d.recoltes) {
    if (/v[ée]rifier/i.test(x.note))
      aVerifier.push({
        onglet: "Recoltes",
        id: String(x.annee_recolte),
        message: `Récolte ${x.annee_recolte} : ${x.note}`,
      });
  }

  const incoherences: Alerte[] = [];
  for (const v of d.ventes) {
    if (v.statut === "offert") continue;
    const calcule = Math.round(
      v.litres * v.prix_unitaire * (v.devise === "EUR" ? (v.taux_eur_mad ?? 0) : 1),
    );
    if (Math.abs(calcule - v.montant_dh) > 1) {
      incoherences.push({
        onglet: "Ventes",
        id: v.id,
        message: `${v.client || "Vente"} (${v.date}) : montant ${v.montant_dh} DH, mais litres × prix = ${calcule} DH (montant corrigé à la main ?)`,
      });
    }
  }
  for (const r of d.recoltes) {
    if (r.kg_olives !== null && r.litres_huile !== null && r.kg_olives > 0) {
      const rendement = (r.litres_huile / r.kg_olives) * 100;
      if (rendement < 5 || rendement > 30) {
        incoherences.push({
          onglet: "Recoltes",
          id: String(r.annee_recolte),
          message: `Récolte ${r.annee_recolte} : rendement de ${rendement.toFixed(1).replace(".", ",")} % inhabituel`,
        });
      }
    }
  }

  const doublons: Alerte[] = [];
  const vus = new Map<string, string>();
  for (const x of d.depenses) {
    const cle = `${x.date}|${x.montant_dh}|${x.description.toLowerCase()}|${x.beneficiaire.toLowerCase()}`;
    const avant = vus.get(cle);
    if (avant)
      doublons.push({
        onglet: "Depenses",
        id: x.id,
        message: `${x.id} ressemble à ${avant} (même date, montant et description)`,
      });
    else vus.set(cle, x.id);
  }

  return {
    invalides: d.invalides,
    aVerifier,
    incoherences,
    doublons,
    total: d.invalides.length + aVerifier.length + incoherences.length + doublons.length,
  };
}

/** Lien d'ouverture du Google Sheet, ou null si SHEET_ID n'est pas défini. */
export function lienSheet(env: NodeJS.ProcessEnv = process.env): string | null {
  const id = env.SHEET_ID?.trim();
  return id ? `https://docs.google.com/spreadsheets/d/${encodeURIComponent(id)}/edit` : null;
}
