/**
 * Génère les icônes de l'appli (rameau d'olivier) : SVG puis PNG 192/512, maskable 512, Apple 180.
 * Usage : npm run icones   (les fichiers produits sont commités dans public/icons)
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SORTIE = path.join(process.cwd(), "public", "icons");

/** Rameau dessiné dans un carré de 96 ; `echelle` rétrécit le dessin (zone sûre des icônes maskable). */
function svg(fond: string, echelle: number, arrondi: number): string {
  const t = 512 * echelle;
  const d = (512 - t) / 2;
  const k = t / 96;
  const f = (cx: number, cy: number, rot: number, c: string) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="5" ry="13" transform="rotate(${rot} ${cx} ${cy})" fill="${c}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${arrondi}" fill="${fond}"/>
  <g transform="translate(${d} ${d}) scale(${k})">
    <path d="M20 82 C 36 62, 54 44, 78 16" fill="none" stroke="#fffdf8" stroke-width="3" stroke-linecap="round"/>
    ${f(30, 62, -55, "#a3ad86")}${f(40, 71, 40, "#d6dcc0")}${f(42, 52, -50, "#d6dcc0")}${f(53, 60, 45, "#a3ad86")}
    ${f(55, 40, -45, "#a3ad86")}${f(66, 47, 50, "#d6dcc0")}${f(68, 28, -40, "#d6dcc0")}${f(76, 34, 55, "#a3ad86")}
    <ellipse cx="82" cy="18" rx="4.5" ry="6" fill="#fffdf8" transform="rotate(30 82 18)"/>
    <circle cx="46" cy="80" r="5.5" fill="#d9a441"/>
  </g>
</svg>`;
}

async function main() {
  await fs.mkdir(SORTIE, { recursive: true });
  const normal = svg("#3b4520", 0.82, 112);
  const maskable = svg("#3b4520", 0.6, 0); // plein cadre, dessin dans la zone sûre (80 %)
  const apple = svg("#3b4520", 0.82, 0);
  await fs.writeFile(path.join(SORTIE, "icone.svg"), normal);
  await sharp(Buffer.from(normal))
    .resize(192, 192)
    .png()
    .toFile(path.join(SORTIE, "icone-192.png"));
  await sharp(Buffer.from(normal))
    .resize(512, 512)
    .png()
    .toFile(path.join(SORTIE, "icone-512.png"));
  await sharp(Buffer.from(maskable))
    .resize(512, 512)
    .png()
    .toFile(path.join(SORTIE, "icone-maskable-512.png"));
  await sharp(Buffer.from(apple))
    .resize(180, 180)
    .png()
    .toFile(path.join(SORTIE, "apple-touch-icon.png"));
  console.log("Icônes générées dans public/icons.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
