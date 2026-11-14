import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** Codes par défaut, utilisables uniquement en développement (ou avec ALLOW_DEV_CODES=1). */
export const CODE_FAMILLE_DEV = "12345";
export const CODE_ADMIN_DEV = "admin-olive-2026";
const SECRET_DEV = "secret-de-developpement-ne-pas-utiliser-en-production";

/** Format sans « $ » (les fichiers .env le développeraient) : scrypt:<sel hex>:<hachage hex>. */
export function hacherCode(code: string, sel: string = randomBytes(16).toString("hex")): string {
  const h = scryptSync(code, Buffer.from(sel, "hex"), 32).toString("hex");
  return `scrypt:${sel}:${h}`;
}

export function verifierCode(code: string, stocke: string): boolean {
  const [algo, sel, h] = stocke.split(":");
  if (algo !== "scrypt" || !sel || !h) return false;
  const attendu = Buffer.from(h, "hex");
  const calcule = scryptSync(code, Buffer.from(sel, "hex"), attendu.length);
  return calcule.length === attendu.length && timingSafeEqual(calcule, attendu);
}

export class ConfigAccesManquante extends Error {
  constructor() {
    super(
      "Configuration d'accès manquante : définir FAMILY_CODE_HASH, ADMIN_CODE_HASH et SESSION_SECRET (npm run set-codes).",
    );
    this.name = "ConfigAccesManquante";
  }
}

export type ConfigAcces = {
  familleHash: string;
  adminHash: string;
  secret: string;
  /** Change dès qu'un code change : invalide toutes les sessions existantes. */
  version: string;
};

let cacheDev: ConfigAcces | null = null;

export function configAcces(env: NodeJS.ProcessEnv = process.env): ConfigAcces {
  const { FAMILY_CODE_HASH: f, ADMIN_CODE_HASH: a, SESSION_SECRET: s } = env;
  let familleHash = f;
  let adminHash = a;
  let secret = s;
  if (!familleHash || !adminHash || !secret) {
    const autorise = env.NODE_ENV !== "production" || env.ALLOW_DEV_CODES === "1";
    if (!autorise) throw new ConfigAccesManquante();
    if (!cacheDev) {
      cacheDev = {
        familleHash: hacherCode(CODE_FAMILLE_DEV, "00".repeat(16)),
        adminHash: hacherCode(CODE_ADMIN_DEV, "11".repeat(16)),
        secret: SECRET_DEV,
        version: "",
      };
    }
    familleHash = familleHash || cacheDev.familleHash;
    adminHash = adminHash || cacheDev.adminHash;
    secret = secret || cacheDev.secret;
  }
  const version = createHash("sha256")
    .update(`${familleHash}|${adminHash}`)
    .digest("hex")
    .slice(0, 12);
  return { familleHash, adminHash, secret, version };
}

export type Role = "famille" | "admin";

export const CODE_FAMILLE_REGEX = /^\d{5}$/;
export const ADMIN_LONGUEUR_MIN = 8;
