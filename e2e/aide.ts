import type { Page } from "@playwright/test";

export async function connecter(page: Page, role: "famille" | "admin" = "famille") {
  const r = await page.request.post("/api/auth/connexion", {
    data:
      role === "admin"
        ? { code: "admin-olive-2026", mode: "admin" }
        : { code: "12345", mode: "famille" },
  });
  if (!r.ok()) throw new Error(`Connexion impossible (${r.status()})`);
}
