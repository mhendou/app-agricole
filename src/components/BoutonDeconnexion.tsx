"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function BoutonDeconnexion() {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Se déconnecter"
      title="Se déconnecter"
      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-pierre hover:bg-sauge/25"
      onClick={async () => {
        await fetch("/api/auth/deconnexion", { method: "POST" });
        // on efface les pages gardées hors connexion : elles contiennent les chiffres de la famille
        try {
          await caches.delete("pages-v1");
        } catch {}
        router.replace("/code");
        router.refresh();
      }}
    >
      <LogOut size={20} strokeWidth={1.5} />
    </button>
  );
}
