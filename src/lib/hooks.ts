"use client";

import { useSyncExternalStore } from "react";

function useMedia(requete: string, serveur: boolean): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(requete);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(requete).matches,
    () => serveur,
  );
}

export const usePrefersReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)", false);

/** Vrai à partir de 640 px de large (libellés de graphiques plus détaillés). */
export const useLarge = () => useMedia("(min-width: 640px)", false);
