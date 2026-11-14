# Décisions prises en autonomie

- Stack : Next.js 16 (App Router), React 19, Tailwind 4, Vitest, Playwright (versions installées par npm au moment du développement).
- Projet initialisé à la main (create-next-app refuse un dossier non vide).
- Litres vendus = payés + à encaisser (hors offerts). Prix moyen au litre = (encaissé + à encaisser) ÷ litres vendus. Histogramme mensuel : ventes encaissées par mois de la date de vente.
- Une année de récolte « connue » = `kg_olives` non vide (0 compte dans la moyenne, donnée perdue non).
- Une ligne sans `id` dans le Sheet reçoit un id technique `ligne-N` à la lecture (elle reste visible, mais non modifiable depuis l'appli tant qu'on n'a pas ajouté un id).
- Listes déroulantes du Sheet non bloquantes (strict=false) et protection des en-têtes en simple avertissement : le Sheet reste librement modifiable.
