import type { Cellule } from "../parse";

/** Lecteur CSV minimal (guillemets, virgules et retours à la ligne dans les champs, BOM). */
export function parseCsv(texte: string): Cellule[][] {
  const src = texte.replace(/^﻿/, "");
  const rows: string[][] = [];
  let champ = "";
  let ligne: string[] = [];
  let entreGuillemets = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (entreGuillemets) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          champ += '"';
          i++;
        } else entreGuillemets = false;
      } else champ += c;
    } else if (c === '"') entreGuillemets = true;
    else if (c === ",") {
      ligne.push(champ);
      champ = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      ligne.push(champ);
      champ = "";
      rows.push(ligne);
      ligne = [];
    } else champ += c;
  }
  if (champ !== "" || ligne.length > 0) {
    ligne.push(champ);
    rows.push(ligne);
  }
  return rows;
}
