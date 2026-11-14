# Oliveraie d'Afourer — appli familiale

Une appli simple et belle pour suivre l'oliveraie familiale d'Afourer (38 oliviers Picholine marocaine) : dépenses, ventes d'huile, récoltes depuis 2013 et pluie. Le **Google Sheet est la base de données** ; l'appli est une vitrine installable (PWA) avec une saisie guidée pour l'administrateur.

Cahier des charges complet : [CLAUDE.md](CLAUDE.md). Décisions prises : [DECISIONS.md](DECISIONS.md).

## Lancer en local

Prérequis : Node.js 20 ou plus.

```bash
npm install
npm run dev
```

Puis ouvrir <http://localhost:3000>.

- Code famille (lecture seule) : `12345`
- Code administrateur (lien « Accès administrateur ») : `admin-olive-2026`

En local, les données sont des fichiers JSON dans `.data-local/`, créés au premier lancement à partir de `/data/*.csv` (`DATA_SOURCE=mock`, valeur par défaut). Supprimer `.data-local/` remet les données de départ.
Les codes par défaut ne fonctionnent qu'en développement : en production il faut définir `FAMILY_CODE_HASH`, `ADMIN_CODE_HASH` et `SESSION_SECRET`.

Pour remplir la pluie historique (réseau requis, Open-Meteo) :

```bash
npm run rattrapage-pluie
```

## Commandes utiles

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run check` | lint + types + tests unitaires + build (à faire passer avant tout commit) |
| `npm run test:e2e` | parcours Playwright (utilise Microsoft Edge, rien à télécharger) |
| `npm run set-codes` | génère les hachages des codes d'accès |
| `npm run init-sheet` / `npm run seed-sheet` | préparent le Google Sheet (voir [docs/sheet.md](docs/sheet.md)) |
| `npm run rattrapage-pluie` | historique de pluie depuis 2013 |
| `npm run icones` | régénère les icônes de l'appli |

Revue visuelle et accessibilité (captures dans `docs/captures/`) :
`CAPTURES=1 PW_DATA_DIR=.data-local npx playwright test e2e/qualite.spec.ts`

## Organisation

- `src/app` : écrans (Accueil, Dépenses, Ventes, Récoltes, Météo, Contrôle des données) et routes API.
- `src/lib` : logique (indicateurs `stats.ts`, parsing tolérant `parse.ts`, accès aux données `data/`, codes `auth/`, taux `fx.ts`, météo `meteo.ts`).
- `src/lib/data` : interface `DataSource` avec les implémentations `mock` et `sheets`.
- `data/` : données de départ (CSV).
- `docs/` : guides (mise en ligne, famille, Google Sheet).

## Mettre en ligne

Voir [docs/mise-en-ligne.md](docs/mise-en-ligne.md). Pour la famille : [docs/guide-famille.md](docs/guide-famille.md).

Données météo : Open-Meteo.com (usage non commercial). Taux de change : open.er-api.com (ExchangeRate-API).
