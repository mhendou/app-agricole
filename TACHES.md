# Tâches — nuit du 14 novembre 2026

Cocher `[x]` quand la tâche est finie et que `npm run check` passe. Une tâche à la fois, dans l'ordre.

## Phase 0 — Socle
- [x] T01 Initialiser Next.js (App Router, TypeScript strict, Tailwind), ESLint, Prettier, Vitest, Playwright, git. Script `npm run check` = lint + typecheck + tests unitaires + build. Créer `.env.example`, `.gitignore` (inclure `.env*.local`, `.data-local/`), `DECISIONS.md`, `JOURNAL.md`.
- [x] T02 Jetons de design (section 3 de CLAUDE.md) dans Tailwind et CSS, polices Fraunces + Inter via next/font, composants de base : Carte, CarteChiffre, Badge, Bouton, BarreProportion, SelecteurAnnee, EtatVide, Chargement, Erreur. Page `/style` qui les montre tous.

## Phase 1 — Données
- [x] T03 Types et schémas zod pour Depenses, Ventes, Recoltes, Pluie, Parametres. Parsing tolérant + tests (virgule décimale, dates numéro de série et texte, lignes vides, colonnes dans le désordre).
- [ ] T04 Interface `DataSource` + implémentation `mock` (JSON dans `.data-local/`, initialisée depuis `/data/*.csv`) avec lecture, ajout, modification, suppression par `id`. Tests.
- [ ] T05 Implémentation `sheets` (googleapis, batchGet UNFORMATTED_VALUE, cache 60 s, colonnes retrouvées par nom, écriture par id). Tests avec googleapis simulé (aucun appel réel). Scripts `scripts/init-sheet.ts` (crée onglets, en-têtes, formats, listes déroulantes, idempotent) et `scripts/seed-sheet.ts` (charge `/data/*.csv`), documentés dans `docs/sheet.md`, **non exécutés**.
- [ ] T06 `/lib/stats` : tous les indicateurs de la section 6, avec tests sur les repères de la section 5 (1 844 kg de moyenne, 10 680 DH, 8 631 DH, 18,1 %, 2025 deuxième après 2017, 2015 = donnée perdue).

## Phase 2 — Accès
- [ ] T07 Accès par code (section 9) : écran clavier 5 chiffres, lien « Accès administrateur », cookie signé, rôles, anti-force brute, middleware de protection, script `npm run set-codes`. En développement, codes par défaut `12345` (famille) et `admin-olive-2026` (admin), notés dans `.env.example`. Tests unitaires + test Playwright (mauvais code, bon code, lecteur ne voit aucun bouton d'écriture, écriture refusée côté serveur pour un lecteur).

## Phase 3 — Écrans de lecture
- [ ] T08 Mise en page : barre d'onglets mobile, menu latéral bureau, en-tête avec nom de l'exploitation et sélecteur d'année.
- [ ] T09 Écran Accueil (section 4.1) avec données réelles du mock.
- [ ] T10 Écran Dépenses (4.2).
- [ ] T11 Écran Ventes (4.3).
- [ ] T12 Écran Récoltes (4.4), années perdues hachurées.

## Phase 4 — Saisie admin
- [ ] T13 `/lib/fx` (section 8) avec tests (réseau simulé dans les tests).
- [ ] T14 Formulaires admin Dépense, Vente (bascule DH/€, conversion en direct), Récolte : ajout, modification, suppression avec confirmation, messages de succès, validation. Server actions protégées par le rôle admin. Tests Playwright du parcours d'ajout.

## Phase 5 — Météo
- [ ] T15 `/lib/meteo` (Open-Meteo), route `/api/cron/pluie` protégée par `CRON_SECRET`, `vercel.json` avec le cron quotidien, script `scripts/rattrapage-pluie.ts` depuis 2013. Exécuter le rattrapage **en mode mock** pour remplir `.data-local/` (appel réel à Open-Meteo autorisé). Tests avec réseau simulé.
- [ ] T16 Écran Météo (section 4.5) + carte météo de l'Accueil + graphique bonus pluie vs production.

## Phase 6 — Finitions
- [ ] T17 Récap partageable (section 4.6) : image PNG générée côté serveur (next/og), partage natif avec repli téléchargement.
- [ ] T18 Page admin « Contrôle des données » + bouton « Ouvrir le Google Sheet ».
- [ ] T19 PWA : manifest, icônes rameau d'olivier (SVG puis PNG 192/512 et maskable), service worker avec cache des dernières données, mention « dernière mise à jour ».
- [ ] T20 Revue qualité : relire chaque écran en 360 px et 1280 px avec des captures Playwright enregistrées dans `docs/captures/`, corriger les défauts visuels, vérifier contrastes et tailles tactiles, accessibilité (labels, focus visible).
- [ ] T21 Documentation : `README.md` (lancer en local), `docs/mise-en-ligne.md` (étapes pas à pas : Google Cloud, compte de service, partage du Sheet, `init-sheet`, `seed-sheet`, variables Vercel, déploiement, cron), `docs/guide-famille.md` (installer l'appli sur Android et iPhone et entrer le code, en phrases très simples).
- [ ] T22 Écrire `RAPPORT-MATIN.md` : ce qui marche, ce qui est bloqué, décisions prises, les 5 prochaines actions pour Mhend, et la commande pour voir l'appli (`npm run dev` puis http://localhost:3000, code 12345). Ajouter à la fin de ce fichier la ligne `TOUT EST TERMINÉ`.
