import {
  normaliserEntete,
  parseDate,
  parseDepenses,
  parseParametres,
  parsePluie,
  parseRecoltes,
  parseVentes,
  type Cellule,
} from "../parse";
import type { Depense, Donnees, Pluie, Recolte, TableNom, Vente } from "../types";
import { COLONNES, ONGLETS } from "./colonnes";
import type { SheetsClient } from "./sheets-client";
import {
  DonneeIntrouvable,
  prochainId,
  type DataSource,
  type NouvelleDepense,
  type NouvelleVente,
} from "./source";

const DUREE_CACHE_MS = 60_000;

/** Construit une ligne dans l'ordre des en-têtes réels du Sheet ; les colonnes inconnues gardent leur valeur. */
export function ligneDepuisEntetes(
  entetes: Cellule[],
  valeurs: Record<string, Cellule>,
  existante: Cellule[] = [],
): Cellule[] {
  return entetes.map((h, i) => {
    const cle = normaliserEntete(h);
    if (cle in valeurs) return valeurs[cle] ?? "";
    return existante[i] ?? "";
  });
}

export class SheetsDataSource implements DataSource {
  private cache: { donnees: Donnees; a: number } | null = null;

  constructor(
    private client: SheetsClient,
    private maintenant: () => number = Date.now,
  ) {}

  private invalider() {
    this.cache = null;
  }

  async lireTout(): Promise<Donnees> {
    if (this.cache && this.maintenant() - this.cache.a < DUREE_CACHE_MS) return this.cache.donnees;
    const [dep, ven, rec, plu, par] = await this.client.lireOnglets(ONGLETS);
    const d = parseDepenses(dep ?? []);
    const v = parseVentes(ven ?? []);
    const r = parseRecoltes(rec ?? []);
    const p = parsePluie(plu ?? []);
    const donnees: Donnees = {
      depenses: d.lignes,
      ventes: v.lignes,
      recoltes: r.lignes.sort((a, b) => a.annee_recolte - b.annee_recolte),
      pluie: p.lignes,
      parametres: parseParametres(par ?? []),
      invalides: [...d.invalides, ...v.invalides, ...r.invalides, ...p.invalides],
      lu_le: new Date(this.maintenant()).toISOString(),
    };
    this.cache = { donnees, a: this.maintenant() };
    return donnees;
  }

  /** Lecture fraîche (sans cache) d'un onglet, pour les écritures. */
  private async onglet(nom: TableNom): Promise<{ entetes: Cellule[]; lignes: Cellule[][] }> {
    const [m] = await this.client.lireOnglets([nom]);
    const rows = m ?? [];
    const entetes = rows[0] && rows[0].length > 0 ? rows[0] : [...COLONNES[nom]];
    return { entetes, lignes: rows.slice(1) };
  }

  private trouver(
    entetes: Cellule[],
    lignes: Cellule[][],
    colonne: string,
    valeur: string,
  ): number {
    const j = entetes.findIndex((h) => normaliserEntete(h) === colonne);
    if (j < 0) throw new Error(`Colonne « ${colonne} » absente de l'onglet`);
    // numéro de ligne dans la feuille (1-based, en-tête = 1)
    const i = lignes.findIndex((l) => String(l[j] ?? "").trim() === valeur);
    return i < 0 ? -1 : i + 2;
  }

  private async ajouter<T extends { id: string }>(
    nom: "Depenses" | "Ventes",
    prefixe: string,
    nouveau: Omit<T, "id">,
  ): Promise<T> {
    const { entetes, lignes } = await this.onglet(nom);
    const j = entetes.findIndex((h) => normaliserEntete(h) === "id");
    const id = prochainId(
      prefixe,
      lignes.map((l) => String(l[j] ?? "")),
    );
    const ligne = { ...nouveau, id } as T;
    await this.client.ajouterLignes(nom, [
      ligneDepuisEntetes(entetes, ligne as unknown as Record<string, Cellule>),
    ]);
    this.invalider();
    return ligne;
  }

  private async modifier<T extends { id: string }>(
    nom: "Depenses" | "Ventes",
    id: string,
    valeur: Omit<T, "id">,
  ): Promise<T> {
    const { entetes, lignes } = await this.onglet(nom);
    const n = this.trouver(entetes, lignes, "id", id);
    if (n < 0) throw new DonneeIntrouvable(`Ligne ${id} introuvable`);
    const ligne = { ...valeur, id } as T;
    await this.client.ecrireLignes([
      {
        onglet: nom,
        ligne: n,
        valeurs: ligneDepuisEntetes(
          entetes,
          ligne as unknown as Record<string, Cellule>,
          lignes[n - 2],
        ),
      },
    ]);
    this.invalider();
    return ligne;
  }

  private async supprimer(nom: "Depenses" | "Ventes", id: string): Promise<void> {
    const { entetes, lignes } = await this.onglet(nom);
    const n = this.trouver(entetes, lignes, "id", id);
    if (n < 0) throw new DonneeIntrouvable(`Ligne ${id} introuvable`);
    await this.client.supprimerLigne(nom, n);
    this.invalider();
  }

  ajouterDepense(d: NouvelleDepense) {
    return this.ajouter<Depense>("Depenses", "D", d);
  }
  modifierDepense(id: string, d: NouvelleDepense) {
    return this.modifier<Depense>("Depenses", id, d);
  }
  supprimerDepense(id: string) {
    return this.supprimer("Depenses", id);
  }
  ajouterVente(v: NouvelleVente) {
    return this.ajouter<Vente>("Ventes", "V", v);
  }
  modifierVente(id: string, v: NouvelleVente) {
    return this.modifier<Vente>("Ventes", id, v);
  }
  supprimerVente(id: string) {
    return this.supprimer("Ventes", id);
  }

  async enregistrerRecolte(r: Recolte): Promise<Recolte> {
    const { entetes, lignes } = await this.onglet("Recoltes");
    const n = this.trouver(entetes, lignes, "annee_recolte", String(r.annee_recolte));
    const valeurs = r as unknown as Record<string, Cellule>;
    if (n < 0) {
      await this.client.ajouterLignes("Recoltes", [ligneDepuisEntetes(entetes, valeurs)]);
    } else {
      await this.client.ecrireLignes([
        {
          onglet: "Recoltes",
          ligne: n,
          valeurs: ligneDepuisEntetes(entetes, valeurs, lignes[n - 2]),
        },
      ]);
    }
    this.invalider();
    return r;
  }

  async supprimerRecolte(annee: number): Promise<void> {
    const { entetes, lignes } = await this.onglet("Recoltes");
    const n = this.trouver(entetes, lignes, "annee_recolte", String(annee));
    if (n < 0) throw new DonneeIntrouvable(`Récolte ${annee} introuvable`);
    await this.client.supprimerLigne("Recoltes", n);
    this.invalider();
  }

  async ajouterPluie(entrantes: Pluie[]): Promise<number> {
    const { entetes, lignes } = await this.onglet("Pluie");
    const jDate = entetes.findIndex((h) => normaliserEntete(h) === "date");
    const existantes = parsePluie([entetes, ...lignes]).lignes;
    const deja = new Map(existantes.map((p) => [p.date, p]));
    // numéro de ligne dans la feuille de chaque date existante
    const numeroLigne = new Map<string, number>();
    lignes.forEach((l, i) => {
      const iso = parseDate(l[jDate]);
      if (iso) numeroLigne.set(iso, i + 2);
    });
    const nouvelles: Cellule[][] = [];
    const maj: { onglet: string; ligne: number; valeurs: Cellule[] }[] = [];
    let ajoutees = 0;
    for (const e of entrantes) {
      const ancien = deja.get(e.date);
      const complet = {
        ...e,
        pluie_mm_mesuree: e.pluie_mm_mesuree ?? ancien?.pluie_mm_mesuree ?? null,
      } as unknown as Record<string, Cellule>;
      const n = numeroLigne.get(e.date);
      if (n === undefined) {
        nouvelles.push(ligneDepuisEntetes(entetes, complet));
        ajoutees++;
        deja.set(e.date, e);
        numeroLigne.set(e.date, -1);
      } else if (n > 0 && ancien && ancien.pluie_mm !== e.pluie_mm) {
        maj.push({
          onglet: "Pluie",
          ligne: n,
          valeurs: ligneDepuisEntetes(entetes, complet, lignes[n - 2]),
        });
      }
    }
    await this.client.ajouterLignes("Pluie", nouvelles);
    await this.client.ecrireLignes(maj);
    this.invalider();
    return ajoutees;
  }
}
