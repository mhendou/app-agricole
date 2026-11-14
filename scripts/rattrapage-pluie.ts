/**
 * Rattrapage de la pluie historique (Open-Meteo) depuis le 1er janvier 2013, sans doublon.
 * Source de données : DATA_SOURCE (mock par défaut → .data-local/, sheets → Google Sheet).
 * Usage : npm run rattrapage-pluie [AAAA-MM-JJ]
 */
import { getDataSource } from "../src/lib/data";
import { PREMIER_JOUR } from "../src/lib/meteo";
import { rattraperPluie } from "../src/lib/pluie-service";

async function main() {
  const depuis = process.argv[2] ?? PREMIER_JOUR;
  const ds = getDataSource();
  console.log(
    `Rattrapage de la pluie depuis ${depuis} (source : ${process.env.DATA_SOURCE ?? "mock"})…`,
  );
  const r = await rattraperPluie(ds, depuis, undefined, new Date(), console.log);
  console.log(`Terminé : ${r.recus} jours reçus, ${r.ajoutes} nouveaux.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
