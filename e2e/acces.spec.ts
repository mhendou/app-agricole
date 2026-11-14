import { expect, test, type Page } from "@playwright/test";

async function saisirCode(page: Page, code: string) {
  for (const c of code) await page.getByRole("button", { name: c, exact: true }).click();
}

const depense = {
  date: "2026-07-01",
  categorie: "Irrigation",
  description: "Test e2e",
  beneficiaire: "",
  montant_dh: 100,
  mode_paiement: "cash",
  note: "",
};

test("sans code, on est redirigé vers l'écran de code", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/code$/);
  await expect(page.getByText("Entrez le code de la famille")).toBeVisible();
});

test("un mauvais code affiche un message clair", async ({ page }) => {
  await page.goto("/code");
  await saisirCode(page, "99999");
  await expect(page.getByRole("alert").first()).toContainText("n'est pas le bon");
  await expect(page).toHaveURL(/\/code$/);
});

test("le bon code famille donne la lecture seule, sans bouton d'écriture", async ({ page }) => {
  await page.goto("/code");
  await saisirCode(page, "12345");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId("role")).toHaveText("Lecture seule");
  await expect(page.getByRole("link", { name: /ajouter/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /ajouter|\+/i })).toHaveCount(0);
});

test("l'écriture est refusée côté serveur pour un lecteur et sans session", async ({
  page,
  request,
}) => {
  const sansSession = await request.post("/api/depenses", { data: depense });
  expect(sansSession.status()).toBe(401);

  await page.goto("/code");
  await saisirCode(page, "12345");
  await expect(page.getByTestId("role")).toBeVisible();
  const lecteur = await page.request.post("/api/depenses", { data: depense });
  expect(lecteur.status()).toBe(403);
});

test("l'administrateur peut se connecter et écrire", async ({ page }) => {
  await page.goto("/code");
  await page.getByRole("button", { name: "Accès administrateur" }).click();
  await page.getByLabel("Code administrateur").fill("admin-olive-2026");
  await page.getByRole("button", { name: "Entrer" }).click();
  await expect(page.getByTestId("role")).toHaveText("Administrateur");
  const r = await page.request.post("/api/depenses", { data: depense });
  expect(r.status()).toBe(201);
});

test("un mauvais code administrateur est refusé", async ({ page }) => {
  await page.goto("/code");
  await page.getByRole("button", { name: "Accès administrateur" }).click();
  await page.getByLabel("Code administrateur").fill("pas-le-bon-code");
  await page.getByRole("button", { name: "Entrer" }).click();
  await expect(page.getByRole("alert").first()).toContainText("n'est pas le bon");
});
