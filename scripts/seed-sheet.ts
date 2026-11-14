/**
 * Charge les données de départ (/data/*.csv) dans le Google Sheet.
 * Ne fait RIEN pour un onglet qui contient déjà des données.
 * Usage : npm run seed-sheet
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { COLONNES } from "../src/lib/data/colonnes";
import { parseCsv } from "../src/lib/data/csv";
import { avecIds } from "../src/lib/data/mock";
import { creerClientDepuisEnv } from "../src/lib/data/sheets-client";
import { ligneDepuisEntetes } from "../src/lib/data/sheets";
import { parseDepenses, parseRecoltes, parseVentes, type Cellule } from "../src/lib/parse";
import type { TableNom } from "../src/lib/types";

async function csv(nom: string): Promise<Cellule[][]> {
  return parseCsv(await fs.readFile(path.join(process.cwd(), "data", nom), "utf8"));
}

async function main() {
  const client = creerClientDepuisEnv();
  const onglets: TableNom[] = ["Depenses", "Ventes", "Recoltes"];
  const actuel = await client.lireOnglets(onglets);

  const graines: Record<string, Record<string, Cellule>[]> = {
    Depenses: parseDepenses(avecIds(await csv("depenses-2026.csv"), "D")).lignes as never,
    Ventes: parseVentes(avecIds(await csv("ventes-2026.csv"), "V")).lignes as never,
    Recoltes: parseRecoltes(await csv("recoltes.csv")).lignes as never,
  };

  for (let i = 0; i < onglets.length; i++) {
    const nom = onglets[i];
    const rows = actuel[i] ?? [];
    if (rows.length > 1) {
      console.log(`${nom} : déjà ${rows.length - 1} ligne(s), rien n'est inséré.`);
      continue;
    }
    const entetes: Cellule[] = rows[0]?.length ? rows[0] : [...COLONNES[nom]];
    if (!rows[0]?.length) {
      throw new Error(`L'onglet ${nom} n'a pas d'en-têtes : lancer d'abord npm run init-sheet.`);
    }
    const lignes = graines[nom].map((g) => ligneDepuisEntetes(entetes, g));
    await client.ajouterLignes(nom, lignes);
    console.log(`${nom} : ${lignes.length} ligne(s) insérée(s).`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
