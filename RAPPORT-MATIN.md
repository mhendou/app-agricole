# Rapport du matin — nuit du 14 novembre 2026

Les 22 tâches de `TACHES.md` sont faites et commitées (aucune bloquée). `npm run check` passe : 72 tests unitaires, build OK. 19 parcours Playwright passent aussi (`npm run test:e2e`).

## Voir l'appli

```bash
npm run dev
```

Puis ouvrir <http://localhost:3000>. Code famille : `12345`. Code administrateur (lien « Accès administrateur ») : `admin-olive-2026`.
Les données locales (`.data-local/`) contiennent les CSV de départ **et** la pluie réelle d'Open-Meteo de 2013 à hier. Captures des écrans à 360 px et 1280 px : `docs/captures/`.

## Ce qui marche

- **Accès par code** : clavier à 5 chiffres, accès admin, cookie signé de 180 jours, blocage après 5 essais, écriture vérifiée côté serveur (testé : un lecteur reçoit 403).
- **Écrans** : Accueil, Dépenses, Ventes, Récoltes (2015 hachurée « donnée perdue », 2023 = 0 kg), Météo (prévision 7 jours, Meteoblue, attribution Open-Meteo), Contrôle des données (admin).
- **Saisie admin** : dépense, vente (bascule DH/€, conversion en direct, taux figé dans la ligne), récolte ; ajout, modification, suppression avec confirmation.
- **Repères vérifiés par les tests** : moyenne 1 844 kg, ventes 2026 = 10 680 DH, dépenses 2026 = 8 631 DH, rendement 18,1 %, 2025 = 2e année après 2017.
- **Récap partageable** (image PNG + partage natif), **PWA** installable avec lecture hors connexion et mention « dernière mise à jour ».
- **Qualité** : contrastes WCAG AA (axe-core), cibles tactiles ≥ 44 px, pas de défilement horizontal à 360 px.
- **Documentation** : `README.md`, `docs/mise-en-ligne.md`, `docs/guide-famille.md`, `docs/sheet.md`.

## Ce qui n'a pas pu être fait ou vérifié

- **Rien n'a été testé contre le vrai Google Sheet** (aucune clé, comme prévu) : l'implémentation `sheets` est couverte par des tests avec Google simulé seulement. Les scripts `init-sheet` et `seed-sheet` n'ont **pas été exécutés**.
- Rien n'est déployé, rien n'a été poussé sur git.
- L'appli n'a pas été essayée sur un vrai téléphone (Android/iPhone) : l'installation PWA et le partage natif WhatsApp sont à vérifier à la main.
- Le cron de pluie n'a été testé qu'avec un réseau simulé (le rattrapage, lui, a bien tourné en vrai).

## Décisions importantes (détail dans `DECISIONS.md`)

- **Frankfurter ne fournit pas le dirham** (404 vérifié) : le taux vient en pratique d'open.er-api.com (attribution requise), puis du taux de secours modifiable dans `Parametres`.
- Next.js 16 : le « middleware » s'appelle `proxy.ts`. Écritures par routes API (testables), pas par server actions.
- Anti-force brute en mémoire serveur : fiable en local, « au mieux » sur Vercel.
- Litres vendus = payés + à encaisser (hors offerts) ; prix moyen = (encaissé + à encaisser) ÷ litres vendus.
- Couleur de texte `argile-texte` (#9A4423) ajoutée : #B4532A seul ne passe pas le contraste AA sur le fond sable.
- Données de départ à vérifier (notes « à vérifier » du CSV) : listées dans Contrôle des données.

## Les 5 prochaines actions pour Mhend

1. Lancer `npm run dev`, parcourir les écrans et dire ce qui ne plaît pas (textes, couleurs, ordre des cartes).
2. Suivre `docs/mise-en-ligne.md` : compte de service Google, partage du Sheet, `npm run init-sheet`, puis `npm run set-codes`.
3. Mettre à jour `latitude` / `longitude` dans l'onglet `Parametres` avec le point GPS exact du terrain, puis relancer `npm run rattrapage-pluie` avec `DATA_SOURCE=sheets`.
4. Déployer sur Vercel (variables d'environnement, `CRON_SECRET`) et vérifier le cron.
5. Installer l'appli sur le téléphone de votre mère et de vos sœurs avec `docs/guide-famille.md`, et tester le partage du récap sur WhatsApp.

TOUT EST TERMINÉ
