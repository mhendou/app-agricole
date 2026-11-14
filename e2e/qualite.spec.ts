import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { connecter } from "./aide";

/**
 * Revue qualité : captures 360 px / 1280 px dans docs/captures, contrôle d'accessibilité (axe),
 * cibles tactiles ≥ 44 px et absence de défilement horizontal.
 * Lancer : CAPTURES=1 PW_DATA_DIR=.data-local npx playwright test e2e/qualite.spec.ts
 */
test.skip(!process.env.CAPTURES, "Revue qualité : lancée à la demande (CAPTURES=1)");

const ECRANS: { nom: string; url: string; admin?: boolean }[] = [
  { nom: "accueil", url: "/?annee=2026" },
  { nom: "depenses", url: "/depenses?annee=2026" },
  { nom: "ventes", url: "/ventes?annee=2026" },
  { nom: "recoltes", url: "/recoltes?annee=2025" },
  { nom: "meteo", url: "/meteo?annee=2026" },
  { nom: "form-depense", url: "/depenses/nouvelle", admin: true },
  { nom: "form-vente", url: "/ventes/nouvelle", admin: true },
  { nom: "form-recolte", url: "/recoltes/nouvelle", admin: true },
  { nom: "controle", url: "/admin/controle", admin: true },
];

const TAILLES = [
  { nom: "360", width: 360, height: 780 },
  { nom: "1280", width: 1280, height: 900 },
];

async function petitesCibles(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    const sel =
      "a[href], button, input:not([type=hidden]):not([type=checkbox]), select, textarea, summary";
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || s.visibility === "hidden" || s.display === "none")
        continue;
      // un lien dans une phrase n'est pas une cible isolée
      const enLigne = s.display === "inline" && !el.closest("li, nav, button");
      if (enLigne) continue;
      if (r.height < 43.5 || r.width < 43.5) {
        out.push(
          `${el.tagName.toLowerCase()} « ${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40)} » ${Math.round(r.width)}×${Math.round(r.height)}`,
        );
      }
    }
    return out;
  });
}

for (const t of TAILLES) {
  test.describe(`écrans à ${t.nom} px`, () => {
    test.use({ viewport: { width: t.width, height: t.height } });

    for (const e of ECRANS) {
      test(`${e.nom}`, async ({ page }) => {
        await connecter(page, e.admin ? "admin" : "famille");
        await page.goto(e.url);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(900); // fin des animations
        await page.screenshot({ path: `docs/captures/${e.nom}-${t.nom}.png`, fullPage: true });

        const debordement = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(debordement, "défilement horizontal").toBeLessThanOrEqual(1);

        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        const resume = axe.violations.map(
          (v) => `${v.id} (${v.nodes.length}) : ${v.nodes[0]?.target.join(" ")}`,
        );
        expect(resume, "violations d'accessibilité").toEqual([]);

        const cibles = await petitesCibles(page);
        expect(cibles, "cibles tactiles < 44 px").toEqual([]);
      });
    }
  });
}

test("écran de code à 360 px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/code");
  await page.screenshot({ path: "docs/captures/code-360.png", fullPage: true });
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
  expect(await petitesCibles(page)).toEqual([]);
});
