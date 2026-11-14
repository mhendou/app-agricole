import { cookies } from "next/headers";
import { configAcces, type Role } from "./codes";
import { COOKIE_SESSION, lireJeton } from "./session";

/** Rôle de la session courante (serveur uniquement), null si non connecté. */
export async function getRole(): Promise<Role | null> {
  const c = await cookies();
  const cfg = configAcces();
  return lireJeton(c.get(COOKIE_SESSION)?.value, cfg.version, cfg.secret);
}

/** Garde pour les routes d'écriture : renvoie une réponse d'erreur, ou null si l'admin est connecté. */
export async function gardeAdmin(): Promise<Response | null> {
  const role = await getRole();
  if (role === "admin") return null;
  if (role === null) return Response.json({ erreur: "Connexion requise." }, { status: 401 });
  return Response.json({ erreur: "Action réservée à l'administrateur." }, { status: 403 });
}
