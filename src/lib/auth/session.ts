import { createHmac, timingSafeEqual } from "node:crypto";
import type { Role } from "./codes";

export const COOKIE_SESSION = "olive_session";
export const DUREE_SESSION_S = 180 * 24 * 3600;

type Charge = { r: Role; v: string; e: number };

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const signer = (donnees: string, secret: string) =>
  createHmac("sha256", secret).update(donnees).digest("base64url");

export function creerJeton(
  role: Role,
  version: string,
  secret: string,
  maintenantS: number = Math.floor(Date.now() / 1000),
): string {
  const charge: Charge = { r: role, v: version, e: maintenantS + DUREE_SESSION_S };
  const corps = b64(JSON.stringify(charge));
  return `${corps}.${signer(corps, secret)}`;
}

/** Renvoie le rôle si le jeton est authentique, non expiré et de la version de code en cours. */
export function lireJeton(
  jeton: string | undefined,
  version: string,
  secret: string,
  maintenantS: number = Math.floor(Date.now() / 1000),
): Role | null {
  if (!jeton) return null;
  const [corps, signature] = jeton.split(".");
  if (!corps || !signature) return null;
  const attendu = Buffer.from(signer(corps, secret));
  const recu = Buffer.from(signature);
  if (attendu.length !== recu.length || !timingSafeEqual(attendu, recu)) return null;
  try {
    const c = JSON.parse(Buffer.from(corps, "base64url").toString("utf8")) as Charge;
    if (c.v !== version || c.e < maintenantS) return null;
    return c.r === "admin" || c.r === "famille" ? c.r : null;
  } catch {
    return null;
  }
}

export const optionsCookie = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: DUREE_SESSION_S,
});
