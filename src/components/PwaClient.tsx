"use client";

import { useEffect, useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

/** Enregistre le service worker (production uniquement). */
export function EnregistrerSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

function useEnLigne(): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

/** Bandeau affiché quand l'appareil est hors connexion : les chiffres sont ceux de la dernière mise à jour. */
export function BandeauHorsLigne({ miseAJour }: { miseAJour: string }) {
  const enLigne = useEnLigne();
  if (enLigne) return null;
  return (
    <p
      role="status"
      className="flex items-center gap-2 bg-ocre/25 px-4 py-2 text-center text-base font-medium text-[#4f3800]"
    >
      <WifiOff size={18} strokeWidth={1.75} aria-hidden="true" />
      Hors connexion — données de la dernière mise à jour : {miseAJour}
    </p>
  );
}
