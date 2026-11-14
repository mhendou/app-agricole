/**
 * Prépare le Google Sheet : onglets, en-têtes, formats, listes déroulantes, protection des en-têtes.
 * Idempotent : ne supprime et n'écrase aucune donnée existante.
 * Usage : npm run init-sheet   (variables SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY)
 */
import { google, type sheets_v4 } from "googleapis";
import {
  COLONNES,
  COLONNES_DATE,
  COLONNES_NOMBRE,
  LISTES,
  ONGLETS,
} from "../src/lib/data/colonnes";
import { normaliserEntete } from "../src/lib/parse";
import { PARAMETRES_DEFAUT } from "../src/lib/types";

const DESCRIPTION_PROTECTION = "En-têtes : ne pas renommer (l'appli lit les colonnes par leur nom)";

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = process.env.SHEET_ID;
  if (!email || !key || !spreadsheetId) {
    throw new Error(
      "Renseigner SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL et GOOGLE_PRIVATE_KEY (voir docs/sheet.md).",
    );
  }
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const lireMeta = async () =>
    (
      await sheets.spreadsheets.get({
        spreadsheetId,
        fields: "sheets(properties(sheetId,title),protectedRanges(description))",
      })
    ).data.sheets ?? [];

  // 1. Onglets manquants
  let meta = await lireMeta();
  const manquants = ONGLETS.filter((o) => !meta.some((s) => s.properties?.title === o));
  if (manquants.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: manquants.map((title) => ({ addSheet: { properties: { title } } })),
      },
    });
    console.log("Onglets créés :", manquants.join(", "));
    meta = await lireMeta();
  }

  const requetes: sheets_v4.Schema$Request[] = [];
  for (const onglet of ONGLETS) {
    const feuille = meta.find((s) => s.properties?.title === onglet)!;
    const sheetId = feuille.properties!.sheetId!;

    // 2. En-têtes : écrits si absents, complétés à droite si une colonne manque (jamais écrasés)
    const lu = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${onglet}'!1:1`,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const existants = ((lu.data.values?.[0] ?? []) as string[]).map((h) => String(h));
    const normaux = existants.map(normaliserEntete);
    const aAjouter = COLONNES[onglet].filter((c) => !normaux.includes(c));
    if (aAjouter.length > 0) {
      const debut = existants.length;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${onglet}'!R1C${debut + 1}`,
        valueInputOption: "RAW",
        requestBody: { values: [aAjouter as string[]] },
      });
      existants.push(...aAjouter);
      console.log(`${onglet} : en-têtes ajoutés → ${aAjouter.join(", ")}`);
    }
    const colonne = (nom: string) => existants.map(normaliserEntete).indexOf(nom);

    // 3. Ligne d'en-tête figée
    requetes.push({
      updateSheetProperties: {
        properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
        fields: "gridProperties.frozenRowCount",
      },
    });
    // En-tête en gras
    requetes.push({
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
        cell: { userEnteredFormat: { textFormat: { bold: true } } },
        fields: "userEnteredFormat.textFormat.bold",
      },
    });

    // 4. Formats date / nombre (colonne entière, hors en-tête)
    const format = (
      cols: readonly string[] | undefined,
      type: "DATE" | "NUMBER",
      pattern: string,
    ) => {
      for (const c of cols ?? []) {
        const j = colonne(c);
        if (j < 0) continue;
        requetes.push({
          repeatCell: {
            range: { sheetId, startRowIndex: 1, startColumnIndex: j, endColumnIndex: j + 1 },
            cell: { userEnteredFormat: { numberFormat: { type, pattern } } },
            fields: "userEnteredFormat.numberFormat",
          },
        });
      }
    };
    format(COLONNES_DATE[onglet], "DATE", "yyyy-mm-dd");
    format(COLONNES_NOMBRE[onglet], "NUMBER", onglet === "Recoltes" ? "0" : "#,##0.##");

    // 5. Listes déroulantes
    for (const [c, valeurs] of Object.entries(LISTES[onglet] ?? {})) {
      const j = colonne(c);
      if (j < 0) continue;
      requetes.push({
        setDataValidation: {
          range: { sheetId, startRowIndex: 1, startColumnIndex: j, endColumnIndex: j + 1 },
          rule: {
            condition: {
              type: "ONE_OF_LIST",
              values: valeurs.map((v) => ({ userEnteredValue: v })),
            },
            showCustomUi: true,
            strict: false, // avertit sans bloquer : le Sheet reste modifiable librement
          },
        },
      });
    }

    // 6. Protection (avertissement) de la ligne d'en-tête, une seule fois
    const deja = feuille.protectedRanges?.some((p) => p.description === DESCRIPTION_PROTECTION);
    if (!deja) {
      requetes.push({
        addProtectedRange: {
          protectedRange: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
            description: DESCRIPTION_PROTECTION,
            warningOnly: true,
          },
        },
      });
    }

    // 7. Paramètres par défaut si l'onglet est vide
    if (onglet === "Parametres") {
      const l = await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Parametres'!A2:B" });
      if ((l.data.values ?? []).length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: "'Parametres'!A2",
          valueInputOption: "RAW",
          requestBody: { values: Object.entries(PARAMETRES_DEFAUT).map(([k, v]) => [k, v]) },
        });
        console.log("Parametres : valeurs par défaut écrites.");
      }
    }
  }

  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: requetes } });
  console.log("Google Sheet prêt.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
