import { expect, test } from "@playwright/test";
import { connecter } from "./aide";

test("manifest, icônes et service worker sont publics", async ({ request }) => {
  const m = await request.get("/manifest.webmanifest");
  expect(m.status()).toBe(200);
  const j = await m.json();
  expect(j.display).toBe("standalone");
  expect(j.lang).toBe("fr");
  const tailles = j.icons.map(
    (i: { sizes: string; purpose?: string }) => `${i.sizes}/${i.purpose}`,
  );
  expect(tailles).toContain("192x192/any");
  expect(tailles).toContain("512x512/maskable");
  for (const f of [
    "icone-192.png",
    "icone-512.png",
    "icone-maskable-512.png",
    "apple-touch-icon.png",
  ]) {
    expect((await request.get(`/icons/${f}`)).status()).toBe(200);
  }
  const sw = await request.get("/sw.js");
  expect(sw.status()).toBe(200);
  expect(sw.headers()["cache-control"]).toContain("no-cache");
});

test("hors connexion, la dernière page consultée reste lisible avec sa date de mise à jour", async ({
  page,
  context,
}) => {
  await connecter(page);
  await page.goto("/?annee=2026");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // le service worker contrôle la page après un rechargement
  await page.goto("/depenses?annee=2026");
  await expect(page.getByText(/Dernière mise à jour/)).toBeVisible();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.goto("/depenses?annee=2026");
  await context.setOffline(true);
  await page.goto("/depenses?annee=2026");
  await expect(page.getByRole("heading", { name: "Dépenses 2026" })).toBeVisible();
  await expect(page.getByText(/Dernière mise à jour/).first()).toBeVisible();
  await context.setOffline(false);
});
