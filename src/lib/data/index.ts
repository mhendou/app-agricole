import { MockDataSource } from "./mock";
import { SheetsDataSource } from "./sheets";
import { creerClientDepuisEnv } from "./sheets-client";
import type { DataSource } from "./source";

export type { DataSource } from "./source";

let instance: DataSource | null = null;

/** Choix de la source par DATA_SOURCE=mock|sheets (mock par défaut). */
export function getDataSource(): DataSource {
  if (instance) return instance;
  instance =
    process.env.DATA_SOURCE === "sheets"
      ? new SheetsDataSource(creerClientDepuisEnv())
      : new MockDataSource();
  return instance;
}
