"use client";

import { useRouter } from "next/navigation";
import { Bouton } from "@/components/ui";

export function BoutonDeconnexion() {
  const router = useRouter();
  return (
    <Bouton
      variante="secondaire"
      onClick={async () => {
        await fetch("/api/auth/deconnexion", { method: "POST" });
        router.replace("/code");
        router.refresh();
      }}
    >
      Se déconnecter
    </Bouton>
  );
}
