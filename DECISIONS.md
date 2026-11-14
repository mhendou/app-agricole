# Décisions prises en autonomie

- Stack : Next.js 16 (App Router), React 19, Tailwind 4, Vitest, Playwright (versions installées par npm au moment du développement).
- Projet initialisé à la main (create-next-app refuse un dossier non vide).
- Litres vendus = payés + à encaisser (hors offerts). Prix moyen au litre = (encaissé + à encaisser) ÷ litres vendus. Histogramme mensuel : ventes encaissées par mois de la date de vente.
- Une année de récolte « connue » = `kg_olives` non vide (0 compte dans la moyenne, donnée perdue non).
- Une ligne sans `id` dans le Sheet reçoit un id technique `ligne-N` à la lecture (elle reste visible, mais non modifiable depuis l'appli tant qu'on n'a pas ajouté un id).
- Listes déroulantes du Sheet non bloquantes (strict=false) et protection des en-têtes en simple avertissement : le Sheet reste librement modifiable.
- Next.js 16 : le « middleware » s'appelle `proxy.ts` (runtime Node). Il protège toutes les pages et API sauf /code, /api/auth/*, /api/cron/*, PWA ; /admin et /api/admin réservés à l'admin. Chaque route d'écriture revérifie le rôle (`gardeAdmin`).
- Hachage des codes : scrypt, format `scrypt:sel:hash` (sans « $ » pour ne pas être mal interprété dans les fichiers .env).
- Codes de dev (12345 / admin-olive-2026) actifs seulement hors production ou avec ALLOW_DEV_CODES=1 (utilisé par Playwright). En production sans variables, la connexion renvoie une erreur de configuration.
- Anti-force brute en mémoire du serveur (clé IP + empreinte appareil) : fiable en local, « au mieux » sur Vercel (instances multiples).
- Écritures via routes API (`/api/depenses`, etc.) plutôt que server actions : testables directement (statuts 401/403) et vérifiées côté serveur.
- Playwright utilise Microsoft Edge (`channel: msedge`) pour ne rien télécharger ; `npm run test:e2e` (hors `npm run check`).
- Frankfurter (taux BCE) ne publie pas le dirham (réponse 404 vérifiée le 14/11/2026) : en pratique le taux vient du repli open.er-api.com (attribution « Exchange rates by ExchangeRate-API » à afficher), puis du taux de secours. Le code garde l'ordre demandé (Frankfurter d'abord).
- Formulaires admin : écritures par routes API JSON (/api/depenses, /api/ventes, /api/recoltes) validées par zod (lib/saisie.ts) ; le montant en DH d'une vente est calculé côté serveur si absent, et conservé s'il est corrigé à la main. Pages d'écriture (/…/nouvelle, /…/[id]) réservées à l'admin par le proxy ET par la page.
- Pluie : l'archive Open-Meteo a quelques jours de retard ; le cron relit les 10 derniers jours (jusqu'à hier) à chaque passage, les jours sans valeur sont ignorés puis complétés au passage suivant. Route cron fermée (401) si CRON_SECRET n'est pas défini.
