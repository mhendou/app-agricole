/**
 * Anti-force brute : 5 essais faux → blocage de 15 minutes, délai progressif entre les essais.
 * Les compteurs sont gardés en mémoire du serveur (au mieux sur Vercel : chaque instance a les siens).
 */
export const MAX_ESSAIS = 5;
export const DUREE_BLOCAGE_MS = 15 * 60 * 1000;

type Etat = { echecs: number; bloqueJusqua: number };

export class LimiteEssais {
  private etats = new Map<string, Etat>();

  constructor(private maintenant: () => number = Date.now) {}

  /** Millisecondes restantes de blocage (0 si l'accès est permis). */
  blocageRestant(cle: string): number {
    const e = this.etats.get(cle);
    if (!e) return 0;
    const reste = e.bloqueJusqua - this.maintenant();
    if (reste <= 0) {
      if (e.bloqueJusqua > 0) this.etats.delete(cle);
      return 0;
    }
    return reste;
  }

  /** Enregistre un échec ; renvoie le délai (ms) à imposer avant de répondre. */
  echec(cle: string): { bloque: boolean; delaiMs: number } {
    const e = this.etats.get(cle) ?? { echecs: 0, bloqueJusqua: 0 };
    e.echecs += 1;
    const bloque = e.echecs >= MAX_ESSAIS;
    if (bloque) e.bloqueJusqua = this.maintenant() + DUREE_BLOCAGE_MS;
    this.etats.set(cle, e);
    return { bloque, delaiMs: Math.min(e.echecs * 400, 2000) };
  }

  succes(cle: string) {
    this.etats.delete(cle);
  }
}

const g = globalThis as unknown as { __limiteEssais?: LimiteEssais };
export const limiteGlobale = (g.__limiteEssais ??= new LimiteEssais());

/** Clé = IP + empreinte d'appareil (navigateur + langue). */
export function cleClient(req: Request): string {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  const appareil = `${req.headers.get("user-agent") ?? ""}|${req.headers.get("accept-language") ?? ""}`;
  let h = 0;
  for (let i = 0; i < appareil.length; i++) h = (h * 31 + appareil.charCodeAt(i)) | 0;
  return `${ip}#${h}`;
}
