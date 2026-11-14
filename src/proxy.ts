import { NextResponse, type NextRequest } from "next/server";
import { ConfigAccesManquante, configAcces } from "@/lib/auth/codes";
import { COOKIE_SESSION, lireJeton } from "@/lib/auth/session";

/** Chemins accessibles sans code : écran de code, connexion, cron (protégé par son propre secret), PWA. */
const PUBLICS = [
  "/code",
  "/api/auth/",
  "/api/cron/",
  "/manifest.webmanifest",
  "/icons/",
  "/sw.js",
  "/favicon.ico",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLICS.some((p) => pathname === p || (p.endsWith("/") && pathname.startsWith(p)))) {
    return NextResponse.next();
  }
  let role = null;
  try {
    const cfg = configAcces();
    role = lireJeton(req.cookies.get(COOKIE_SESSION)?.value, cfg.version, cfg.secret);
  } catch (e) {
    if (!(e instanceof ConfigAccesManquante)) throw e;
  }
  if (!role) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ erreur: "Connexion requise." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/code", req.url));
  }
  const reserveAdmin =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    /^\/(depenses|ventes|recoltes)\/[^/]+/.test(pathname);
  if (role !== "admin" && reserveAdmin) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ erreur: "Action réservée à l'administrateur." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|ico|webp|woff2?)$).*)"],
};
