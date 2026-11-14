import { promises as fs } from "node:fs";
import path from "node:path";
import { parseCsv } from "./csv";
import { parseDepenses, parsePluie, parseRecoltes, parseVentes, type Cellule } from "../parse";
import {
  PARAMETRES_DEFAUT,
  type Depense,
  type Donnees,
  type Parametres,
  type Pluie,
  type Recolte,
  type Vente,
} from "../types";
import {
  DonneeIntrouvable,
  fusionnerPluie,
  prochainId,
  type DataSource,
  type NouvelleDepense,
  type NouvelleVente,
} from "./source";

type Fichier = "depenses" | "ventes" | "recoltes" | "pluie" | "parametres";

/** Ajoute des ids D001… / V001… aux lignes d'un CSV qui n'en a pas. */
export function avecIds(rows: Cellule[][], prefixe: string): Cellule[][] {
  if (rows.length === 0) return rows;
  const [entete, ...corps] = rows;
  if (entete.map((h) => String(h).trim()).includes("id")) return rows;
  let n = 0;
  return [
    ["id", ...entete],
    ...corps.map((r) =>
      r.every((c) => c === "") ? r : [`${prefixe}${String(++n).padStart(3, "0")}`, ...r],
    ),
  ];
}

export class MockDataSource implements DataSource {
  private fichier: string;
  private seedDir: string;

  constructor(
    dir: string = process.env.DATA_DIR || path.join(process.cwd(), ".data-local"),
    seedDir: string = path.join(process.cwd(), "data"),
  ) {
    this.fichier = dir;
    this.seedDir = seedDir;
  }

  private chemin(f: Fichier): string {
    return path.join(this.fichier, `${f}.json`);
  }

  private async csv(nom: string): Promise<Cellule[][]> {
    try {
      return parseCsv(await fs.readFile(path.join(this.seedDir, nom), "utf8"));
    } catch {
      return [];
    }
  }

  private async graine(f: Fichier): Promise<unknown> {
    switch (f) {
      case "depenses":
        return parseDepenses(avecIds(await this.csv("depenses-2026.csv"), "D")).lignes;
      case "ventes":
        return parseVentes(avecIds(await this.csv("ventes-2026.csv"), "V")).lignes;
      case "recoltes":
        return parseRecoltes(await this.csv("recoltes.csv")).lignes;
      case "pluie":
        return parsePluie(await this.csv("pluie.csv")).lignes;
      case "parametres":
        return PARAMETRES_DEFAUT;
    }
  }

  private async lire<T>(f: Fichier): Promise<T> {
    try {
      return JSON.parse(await fs.readFile(this.chemin(f), "utf8")) as T;
    } catch {
      const valeur = (await this.graine(f)) as T;
      await this.ecrire(f, valeur);
      return valeur;
    }
  }

  private async ecrire(f: Fichier, valeur: unknown): Promise<void> {
    await fs.mkdir(this.fichier, { recursive: true });
    await fs.writeFile(this.chemin(f), JSON.stringify(valeur, null, 2), "utf8");
  }

  async lireTout(): Promise<Donnees> {
    const [depenses, ventes, recoltes, pluie, parametres] = await Promise.all([
      this.lire<Depense[]>("depenses"),
      this.lire<Vente[]>("ventes"),
      this.lire<Recolte[]>("recoltes"),
      this.lire<Pluie[]>("pluie"),
      this.lire<Parametres>("parametres"),
    ]);
    return {
      depenses,
      ventes,
      recoltes,
      pluie,
      parametres: { ...PARAMETRES_DEFAUT, ...parametres },
      invalides: [],
      lu_le: new Date().toISOString(),
    };
  }

  private async ajouter<T extends { id: string }>(
    f: "depenses" | "ventes",
    prefixe: string,
    nouveau: Omit<T, "id">,
  ): Promise<T> {
    const liste = await this.lire<T[]>(f);
    const ligne = {
      ...nouveau,
      id: prochainId(
        prefixe,
        liste.map((l) => l.id),
      ),
    } as T;
    await this.ecrire(f, [...liste, ligne]);
    return ligne;
  }

  private async modifier<T extends { id: string }>(
    f: "depenses" | "ventes",
    id: string,
    valeur: Omit<T, "id">,
  ): Promise<T> {
    const liste = await this.lire<T[]>(f);
    const i = liste.findIndex((l) => l.id === id);
    if (i < 0) throw new DonneeIntrouvable(`Ligne ${id} introuvable`);
    const ligne = { ...valeur, id } as T;
    liste[i] = ligne;
    await this.ecrire(f, liste);
    return ligne;
  }

  private async supprimer<T extends { id: string }>(
    f: "depenses" | "ventes",
    id: string,
  ): Promise<void> {
    const liste = await this.lire<T[]>(f);
    if (!liste.some((l) => l.id === id)) throw new DonneeIntrouvable(`Ligne ${id} introuvable`);
    await this.ecrire(
      f,
      liste.filter((l) => l.id !== id),
    );
  }

  ajouterDepense(d: NouvelleDepense) {
    return this.ajouter<Depense>("depenses", "D", d);
  }
  modifierDepense(id: string, d: NouvelleDepense) {
    return this.modifier<Depense>("depenses", id, d);
  }
  supprimerDepense(id: string) {
    return this.supprimer<Depense>("depenses", id);
  }
  ajouterVente(v: NouvelleVente) {
    return this.ajouter<Vente>("ventes", "V", v);
  }
  modifierVente(id: string, v: NouvelleVente) {
    return this.modifier<Vente>("ventes", id, v);
  }
  supprimerVente(id: string) {
    return this.supprimer<Vente>("ventes", id);
  }

  async enregistrerRecolte(r: Recolte): Promise<Recolte> {
    const liste = await this.lire<Recolte[]>("recoltes");
    const autres = liste.filter((x) => x.annee_recolte !== r.annee_recolte);
    await this.ecrire(
      "recoltes",
      [...autres, r].sort((a, b) => a.annee_recolte - b.annee_recolte),
    );
    return r;
  }

  async supprimerRecolte(annee: number): Promise<void> {
    const liste = await this.lire<Recolte[]>("recoltes");
    if (!liste.some((x) => x.annee_recolte === annee))
      throw new DonneeIntrouvable(`Récolte ${annee} introuvable`);
    await this.ecrire(
      "recoltes",
      liste.filter((x) => x.annee_recolte !== annee),
    );
  }

  async ajouterPluie(lignes: Pluie[]): Promise<number> {
    const existantes = await this.lire<Pluie[]>("pluie");
    const { lignes: fusion, ajoutees } = fusionnerPluie(existantes, lignes);
    await this.ecrire("pluie", fusion);
    return ajoutees;
  }
}
