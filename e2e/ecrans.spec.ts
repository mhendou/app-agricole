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

  test("Dépenses : liste groupée par mois et catégories", async ({ page }) => {
    await page.goto("/depenses?annee=2026");
    await expect(page.getByRole("heading", { name: "Dépenses 2026" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /avril 2026/i })).toBeVisible();
    await expect(page.getByText("Par catégorie")).toBeVisible();
    await expect(page.getByRole("link", { name: /ajouter/i })).toHaveCount(0);
  });

  test("Ventes : à encaisser, litres, badges", async ({ page }) => {
    await page.goto("/ventes?annee=2026");
    await expect(page.getByRole("heading", { name: "Ventes 2026" })).toBeVisible();
    await expect(page.getByText(`600${NB}DH`).first()).toBeVisible();
    await expect(page.getByText("à encaisser", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("offert", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Maroc et hors Maroc")).toBeVisible();
  });

  test("Récoltes : record 2017, moyenne, 2015 perdue", async ({ page }) => {
    await page.goto("/recoltes?annee=2025");
    await expect(page.getByText(`3${NB}948${NB}kg`).first()).toBeVisible();
    await expect(page.getByText(`1${NB}844${NB}kg`).first()).toBeVisible();
    await expect(page.getByText("2e meilleure année")).toBeVisible();
    await expect(page.getByText("donnée perdue", { exact: true }).first()).toBeVisible();
    await page.goto("/recoltes?annee=2015");
    await expect(page.getByText(/Donnée perdue : cette année/)).toBeVisible();
  });

  test("Météo : lien Meteoblue et attribution Open-Meteo", async ({ page }) => {
    await page.goto("/meteo?annee=2026");
    await expect(page.getByRole("heading", { name: "Météo 2026" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Ouvrir Meteoblue/ })).toHaveAttribute(
      "href",
      /meteoblue/,
    );
    await expect(page.getByText(/Open-Meteo.com/).first()).toBeVisible();
    await expect(page.getByText("Les 7 prochains jours")).toBeVisible();
  });
});
