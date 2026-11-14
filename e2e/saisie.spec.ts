import { expect, test } from "@playwright/test";
import { connecter } from "./aide";

const NB = " ";

test.describe("saisie administrateur", () => {
  test("un lecteur est renvoyé à l'accueil depuis une page d'écriture", async ({ page }) => {
    await connecter(page, "famille");
    await page.goto("/depenses/nouvelle");
    await expect(page).toHaveURL(/\/$/);
    const r = await page.request.put("/api/recoltes", {
      data: { annee_recolte: 2030, kg_olives: 1, litres_huile: null, date_recolte: null, note: "" },
    });
    expect(r.status()).toBe(403);
  });

  test("ajout, modification et suppression d'une dépense", async ({ page }) => {
    await connecter(page, "admin");
    await page.goto("/depenses?annee=2026");
    await page.getByRole("link", { name: "Ajouter une dépense" }).click();

    // validation : formulaire vide
    await page.getByRole("button", { name: "Ajouter la dépense" }).click();
    await expect(page.locator("form [role=alert]")).toContainText("catégorie");

    await page.getByLabel("Date").fill("2026-09-10");
    await page.getByLabel("Catégorie").selectOption("Matériel & entretien");
    await page.getByLabel("Montant (DH)").fill("1 234,5");
    await page.getByLabel("Description").fill("Sécateur e2e");
    await page.getByRole("button", { name: "Ajouter la dépense" }).click();

    await expect(page.getByRole("status")).toContainText("C'est enregistré");
    await expect(page.getByText("Sécateur e2e")).toBeVisible();
    await expect(page.getByText(`1${NB}235${NB}DH`).first()).toBeVisible();

    // modification
    await page.getByRole("link", { name: /Sécateur e2e/ }).click();
    await page.getByLabel("Montant (DH)").fill("2000");
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page.getByRole("status")).toContainText("modification est enregistrée");
    await expect(page.getByText(`2${NB}000${NB}DH`).first()).toBeVisible();

    // suppression avec confirmation
    await page.getByRole("link", { name: /Sécateur e2e/ }).click();
    await page.getByRole("button", { name: "Supprimer" }).click();
    await expect(page.getByRole("alertdialog")).toContainText("définitive");
    await page.getByRole("button", { name: "Oui, supprimer" }).click();
    await expect(page.getByRole("status")).toContainText("supprimée");
    await expect(page.getByText("Sécateur e2e")).toHaveCount(0);
  });

  test("vente en euros : conversion en direct et taux figé", async ({ page }) => {
    await connecter(page, "admin");
    await page.route("**/api/taux", (route) =>
      route.fulfill({ json: { taux: 10.8, source: "test", date: new Date().toISOString() } }),
    );
    await page.goto("/ventes/nouvelle");
    await page.getByRole("button", { name: "€", exact: true }).click();
    await expect(page.getByLabel(/Taux du jour/)).toHaveValue("10,8");
    await page.getByLabel("Date").fill("2026-10-01");
    await page.getByLabel("Client").fill("Client e2e Marseille");
    await page.getByLabel("Pays").fill("France");
    await page.getByLabel("Litres").fill("10");
    await page.getByLabel(/Prix au litre/).fill("12");
    await expect(page.getByLabel("Montant en DH")).toHaveValue("1296");
    await expect(page.getByText(/= 1.296.DH/)).toBeVisible();
    await page.getByLabel("Statut").selectOption("à encaisser");
    await page.getByRole("button", { name: "Ajouter la vente" }).click();

    await expect(page.getByRole("status")).toContainText("C'est enregistré");
    await expect(page.getByText("Client e2e Marseille")).toBeVisible();
    await expect(page.getByText(/taux 10,8/)).toBeVisible();
    await expect(page.getByText(`1${NB}296${NB}DH`).first()).toBeVisible();
  });

  test("récolte : ajout d'une année et donnée perdue", async ({ page }) => {
    await connecter(page, "admin");
    await page.goto("/recoltes/nouvelle");
    await page.getByLabel("Année de récolte").fill("2026");
    await page.getByLabel("Olives récoltées (kg)").fill("2 100");
    await page.getByLabel("Huile (litres)").fill("380");
    await page.getByRole("button", { name: "Enregistrer la récolte" }).click();
    await expect(page.getByRole("status")).toContainText("C'est enregistré");
    await expect(page.getByText(`2${NB}100${NB}kg`).first()).toBeVisible();

    await page.goto("/recoltes/2026");
    await page.getByLabel("Donnée perdue (kilos inconnus)").check();
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await page.goto("/recoltes?annee=2026");
    await expect(page.getByText(/Donnée perdue : cette année/)).toBeVisible();
  });
});
