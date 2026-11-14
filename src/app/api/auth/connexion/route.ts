import { NextResponse } from "next/server";
import { z } from "zod";
import { cleClient, limiteGlobale } from "@/lib/auth/bruteforce";
import {
  ADMIN_LONGUEUR_MIN,
  CODE_FAMILLE_REGEX,
  ConfigAccesManquante,
  configAcces,
  verifierCode,
} from "@/lib/auth/codes";
import { COOKIE_SESSION, creerJeton, optionsCookie } from "@/lib/auth/session";

const Corps = z.object({
  code: z.string().min(1).max(128),
  mode: z.enum(["famille", "admin"]),
});

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  let corps;
  try {
    corps = Corps.parse(await req.json());
  } catch {
    return NextResponse.json({ erreur: "Requête invalide." }, { status: 400 });
  }

  const cle = cleClient(req);
  const reste = limiteGlobale.blocageRestant(cle);
  if (reste > 0) {
    const minutes = Math.ceil(reste / 60000);
    return NextResponse.json(
      { erreur: `Trop d'essais. Réessayez dans ${minutes} minute${minutes > 1 ? "s" : ""}.` },
      { status: 429 },
    );
  }

  let cfg;
  try {
    cfg = configAcces();
  } catch (e) {
    if (e instanceof ConfigAccesManquante) {
      return NextResponse.json({ erreur: e.message }, { status: 500 });
    }
    throw e;
  }

  const formatOk =
    corps.mode === "famille"
      ? CODE_FAMILLE_REGEX.test(corps.code)
      : corps.code.length >= ADMIN_LONGUEUR_MIN;
  const hash = corps.mode === "famille" ? cfg.familleHash : cfg.adminHash;
  const ok = formatOk && verifierCode(corps.code, hash);

  if (!ok) {
    const { bloque, delaiMs } = limiteGlobale.echec(cle);
    await pause(delaiMs);
    return NextResponse.json(
      {
        erreur: bloque
          ? "Trop d'essais. Réessayez dans 15 minutes."
          : "Ce code n'est pas le bon. Vérifiez-le et réessayez.",
      },
      { status: 401 },
    );
  }

  limiteGlobale.succes(cle);
  const role = corps.mode === "admin" ? "admin" : "famille";
  const res = NextResponse.json({ role });
  res.cookies.set(COOKIE_SESSION, creerJeton(role, cfg.version, cfg.secret), optionsCookie());
  return res;
}
