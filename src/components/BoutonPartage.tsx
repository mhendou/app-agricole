"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Bouton } from "./ui";

/** Génère l'image du récap, ouvre le partage natif (WhatsApp…) ou, à défaut, la télécharge. */
export function BoutonPartage({ annee }: { annee: number }) {
  const [etat, setEtat] = useState<"repos" | "travail">("repos");
  const [message, setMessage] = useState("");

  async function partager() {
    setEtat("travail");
    setMessage("");
    try {
      const r = await fetch(`/api/recap?annee=${annee}`);
      if (!r.ok) throw new Error("recap");
      const blob = await r.blob();
      const fichier = new File([blob], `recap-oliveraie-${annee}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare?.({ files: [fichier] })) {
        try {
          await nav.share({ files: [fichier], title: `Oliveraie d'Afourer — récap ${annee}` });
        } catch (e) {
          if ((e as DOMException).name !== "AbortError") throw e; // annulé par l'utilisateur : pas une erreur
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fichier.name;
        a.click();
        URL.revokeObjectURL(url);
        setMessage("L'image a été enregistrée sur votre appareil.");
      }
    } catch {
      setMessage("Impossible de créer l'image pour le moment. Réessayez.");
    } finally {
      setEtat("repos");
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Bouton onClick={partager} disabled={etat === "travail"}>
        <Share2 size={20} strokeWidth={1.75} aria-hidden="true" />
        {etat === "travail" ? "Création de l'image…" : "Partager le récap de l'année"}
      </Bouton>
      <p role="status" className="min-h-6 text-base text-pierre">
        {message}
      </p>
    </div>
  );
}
