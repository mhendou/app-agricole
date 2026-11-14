import { MockDataSource } from "./mock";
import type { DataSource } from "./source";

export type { DataSource } from "./source";

let instance: DataSource | null = null;

/** Choix de la source par DATA_SOURCE=mock|sheets (mock par défaut). */
export function getDataSource(): DataSource {
  if (instance) return instance;
  instance = new MockDataSource();
  return instance;
}
