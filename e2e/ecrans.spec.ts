import { expect, test } from "@playwright/test";
import { connecter } from "./aide";

const NB = " ";

test.describe("écrans de lecture", () => {
  test.beforeEach(async ({ page }) => {
    await connecter(page);
  });

  test("Accueil : chiffres de 2026", async ({ page }) => {
    await page.goto("/?annee=2026");
    await expect(page.getByText(`10${NB}680${NB}DH`).first()).toBeVisible();
    // les dépenses varient : les tests d'écriture ajoutent des lignes dans .data-test
    await expect(page.getByText("Dépenses", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Dernière récolte/)).toBeVisible();
    await expect(page.getByText(`3${NB}929${NB}kg`)).toBeVisible();
  });
});
