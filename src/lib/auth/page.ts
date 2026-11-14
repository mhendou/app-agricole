import { redirect } from "next/navigation";
import { getRole } from "./server";

/** À appeler en tête d'une page d'écriture : renvoie à l'accueil si ce n'est pas l'administrateur. */
export async function exigerAdminPage(): Promise<void> {
  if ((await getRole()) !== "admin") redirect("/");
}
