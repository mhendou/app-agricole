"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Delete } from "lucide-react";
import { Rameau } from "@/components/Rameau";
import { Bouton } from "@/components/ui";

const LONGUEUR = 5;

export function EcranCode() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [admin, setAdmin] = useState(false);
  const [mdp, setMdp] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function envoyer(valeur: string, mode: "famille" | "admin") {
    setEnvoi(true);
    setErreur("");
    try {
      const r = await fetch("/api/auth/connexion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: valeur, mode }),
      });
      if (r.ok) {
        router.replace("/");
        router.refresh();
        return;
      }
      const j = (await r.json().catch(() => ({}))) as { erreur?: string };
      setErreur(j.erreur ?? "Une erreur est survenue. Réessayez.");
      setCode("");
    } catch {
      setErreur("Connexion impossible. Vérifiez votre réseau.");
      setCode("");
    } finally {
      setEnvoi(false);
    }
  }

  function toucher(chiffre: string) {
    if (envoi || code.length >= LONGUEUR) return;
    setErreur("");
    const suivant = code + chiffre;
    setCode(suivant);
    if (suivant.length === LONGUEUR) void envoyer(suivant, "famille");
  }

  const touche =
    "flex h-16 min-w-16 items-center justify-center rounded-2xl bg-creme font-titre text-2xl font-semibold shadow-carte active:bg-sauge/30 disabled:opacity-50";

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-6 py-10 text-center">
      <Rameau taille={88} />
      <h1 className="font-titre mt-3 text-3xl font-semibold text-olive-fonce">
        Oliveraie d&apos;Afourer
      </h1>

      {!admin ? (
        <>
          <p className="mt-2 text-pierre">Entrez le code de la famille</p>
          <div
            className="mt-6 flex gap-3"
            aria-label={`${code.length} chiffres saisis sur ${LONGUEUR}`}
            role="img"
          >
            {Array.from({ length: LONGUEUR }, (_, i) => (
              <span
                key={i}
                className={`h-4 w-4 rounded-full border-2 border-olive ${i < code.length ? "bg-olive" : "bg-transparent"}`}
              />
            ))}
          </div>
          <p role="alert" className="mt-4 min-h-12 text-base font-medium text-argile-texte">
            {erreur}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((c) => (
              <button
                key={c}
                type="button"
                className={touche}
                onClick={() => toucher(c)}
                disabled={envoi}
              >
                {c}
              </button>
            ))}
            <span />
            <button type="button" className={touche} onClick={() => toucher("0")} disabled={envoi}>
              0
            </button>
            <button
              type="button"
              className={touche}
              aria-label="Effacer le dernier chiffre"
              onClick={() => setCode(code.slice(0, -1))}
              disabled={envoi}
            >
              <Delete size={26} strokeWidth={1.5} />
            </button>
          </div>
          <button
            type="button"
            className="mt-8 min-h-11 px-4 text-base text-pierre underline underline-offset-4"
            onClick={() => {
              setAdmin(true);
              setErreur("");
            }}
          >
            Accès administrateur
          </button>
        </>
      ) : (
        <form
          className="mt-6 flex w-full flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void envoyer(mdp, "admin");
          }}
        >
          <label htmlFor="code-admin" className="text-pierre">
            Code administrateur
          </label>
          <input
            id="code-admin"
            type="password"
            autoComplete="off"
            value={mdp}
            onChange={(e) => setMdp(e.target.value)}
            className="min-h-12 rounded-xl border border-sauge bg-creme px-4 text-center text-lg"
          />
          <p role="alert" className="min-h-6 text-base font-medium text-argile-texte">
            {erreur}
          </p>
          <Bouton type="submit" disabled={envoi || mdp.length === 0}>
            Entrer
          </Bouton>
          <button
            type="button"
            className="min-h-11 text-base text-pierre underline underline-offset-4"
            onClick={() => {
              setAdmin(false);
              setErreur("");
              setMdp("");
            }}
          >
            Retour au code de la famille
          </button>
        </form>
      )}
    </main>
  );
}
