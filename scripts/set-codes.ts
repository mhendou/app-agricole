/**
 * Génère les hachages des codes d'accès à coller dans .env.local et dans Vercel.
 * Usage : npm run set-codes
 */
import { randomBytes } from "node:crypto";
import readline from "node:readline/promises";
import { ADMIN_LONGUEUR_MIN, CODE_FAMILLE_REGEX, hacherCode } from "../src/lib/auth/codes";

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let famille = "";
  while (!CODE_FAMILLE_REGEX.test(famille)) {
    famille = (await rl.question("Code famille (5 chiffres) : ")).trim();
    if (!CODE_FAMILLE_REGEX.test(famille)) console.log("→ Il faut exactement 5 chiffres.");
  }
  let admin = "";
  while (admin.length < ADMIN_LONGUEUR_MIN || admin === famille) {
    admin = (
      await rl.question(`Code administrateur (au moins ${ADMIN_LONGUEUR_MIN} caractères) : `)
    ).trim();
    if (admin.length < ADMIN_LONGUEUR_MIN || admin === famille) {
      console.log(`→ Au moins ${ADMIN_LONGUEUR_MIN} caractères, et différent du code famille.`);
    }
  }
  rl.close();

  console.log("\nÀ coller dans .env.local ET dans les variables d'environnement Vercel :\n");
  console.log(`FAMILY_CODE_HASH=${hacherCode(famille)}`);
  console.log(`ADMIN_CODE_HASH=${hacherCode(admin)}`);
  console.log(`SESSION_SECRET=${randomBytes(32).toString("hex")}`);
  console.log(
    "\nChanger l'un des codes déconnecte automatiquement tout le monde. Ne partagez jamais ces valeurs.",
  );
}

main();
