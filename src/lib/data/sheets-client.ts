import { createPrivateKey } from "node:crypto";
import { google, type sheets_v4 } from "googleapis";
import type { Cellule } from "../parse";

/** Petite interface au-dessus de l'API Google Sheets, facile à simuler dans les tests. */
export interface SheetsClient {
  /** batchGet en UNFORMATTED_VALUE : une matrice par onglet (ligne 0 = en-têtes). */
  lireOnglets(onglets: string[]): Promise<Cellule[][][]>;
  ajouterLignes(onglet: string, lignes: Cellule[][]): Promise<void>;
  /** Écrit des lignes entières (numéros de ligne 1-based). */
  ecrireLignes(maj: { onglet: string; ligne: number; valeurs: Cellule[] }[]): Promise<void>;
  supprimerLigne(onglet: string, ligne: number): Promise<void>;
}

const quote = (onglet: string) => `'${onglet.replace(/'/g, "''")}'`;

/** Empêche une cellule texte d'être interprétée comme une formule. */
export function proteger(v: Cellule): string | number | boolean {
  if (v === null || v === undefined) return "";
  if (typeof v === "string" && /^[=+\-@]/.test(v) && !/^[-+]?\d+([.,]\d+)?$/.test(v))
    return `'${v}`;
  return v;
}

export function creerClientGoogle(
  sheets: Pick<sheets_v4.Sheets, "spreadsheets">,
  spreadsheetId: string,
): SheetsClient {
  const idOnglet = async (onglet: string): Promise<number> => {
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties(sheetId,title)",
    });
    const f = meta.data.sheets?.find((s) => s.properties?.title === onglet);
    if (f?.properties?.sheetId === undefined || f.properties.sheetId === null) {
      throw new Error(`Onglet « ${onglet} » introuvable dans le Google Sheet`);
    }
    return f.properties.sheetId;
  };

  return {
    async lireOnglets(onglets) {
      const r = await sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges: onglets.map((o) => `${quote(o)}!A:ZZ`),
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "SERIAL_NUMBER",
      });
      const vr = r.data.valueRanges ?? [];
      return onglets.map((_, i) => (vr[i]?.values ?? []) as Cellule[][]);
    },
    async ajouterLignes(onglet, lignes) {
      if (lignes.length === 0) return;
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${quote(onglet)}!A:A`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: lignes.map((l) => l.map(proteger)) },
      });
    },
    async ecrireLignes(maj) {
      if (maj.length === 0) return;
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: "USER_ENTERED",
          data: maj.map((m) => ({
            range: `${quote(m.onglet)}!A${m.ligne}`,
            values: [m.valeurs.map(proteger)],
          })),
        },
      });
    },
    async supprimerLigne(onglet, ligne) {
      const sheetId = await idOnglet(onglet);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: { sheetId, dimension: "ROWS", startIndex: ligne - 1, endIndex: ligne },
              },
            },
          ],
        },
      });
    },
  };
}

/**
 * Reconstruit une clé PEM propre à partir de ce qui a été collé dans la variable
 * d'environnement : guillemets autour, « \n » littéraux, vrais retours à la ligne,
 * retours chariot ou espaces à la place des sauts de ligne.
 */
export function normaliserClePrivee(brute: string | undefined): string | undefined {
  if (!brute) return undefined;
  const texte = brute.trim().replace(/^["']+|["']+$/g, "").replace(/\\r/g, "").replace(/\\n/g, "\n");
  const m = texte.match(/-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/);
  if (!m) return texte;
  const corps = m[2].replace(/[^A-Za-z0-9+/=]/g, "");
  const lignes = corps.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${m[1]}-----\n${lignes.join("\n")}\n-----END ${m[1]}-----\n`;
}

/** Description sans secret de la forme d'une clé, pour diagnostiquer un collage raté. */
export function decrireCle(brute: string | undefined): string {
  if (!brute) return "variable vide.";
  const m = brute.match(/-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END ([A-Z ]+)-----/);
  const corps = m ? m[2].replace(/[^A-Za-z0-9+/=]/g, "") : "";
  return [
    `longueur=${brute.length}`,
    `début_BEGIN=${/^\s*["']?-----BEGIN [A-Z ]+-----/.test(brute)}`,
    `type=${m ? m[1] : "absent"}`,
    `fin_END=${m ? m[3] === m[1] : false}`,
    `corps_base64=${corps.length}`,
    `\\n_littéraux=${(brute.match(/\\n/g) ?? []).length}`,
    `vrais_sauts=${(brute.match(/\n/g) ?? []).length}`,
    "(attendu : type=PRIVATE KEY, corps_base64 ≈ 1600, longueur ≈ 1700)",
  ].join(", ");
}

/** Client réel à partir des variables d'environnement (compte de service). */
export function creerClientDepuisEnv(env: NodeJS.ProcessEnv = process.env): SheetsClient {
  const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const cle = normaliserClePrivee(env.GOOGLE_PRIVATE_KEY);
  const id = env.SHEET_ID;
  if (!email || !cle || !id) {
    throw new Error(
      "Variables manquantes : GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY et SHEET_ID sont requises avec DATA_SOURCE=sheets.",
    );
  }
  try {
    createPrivateKey(cle);
  } catch {
    throw new Error(`GOOGLE_PRIVATE_KEY illisible. ${decrireCle(env.GOOGLE_PRIVATE_KEY)}`);
  }
  const auth = new google.auth.JWT({
    email,
    key: cle,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return creerClientGoogle(google.sheets({ version: "v4", auth }), id);
}
