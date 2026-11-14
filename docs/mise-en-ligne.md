# Mettre l'appli en ligne (pas à pas)

Durée : environ 45 minutes. Tout est gratuit (Google Cloud sans facturation, Vercel plan gratuit).
Vous aurez besoin d'un compte Google (celui qui possède le Sheet) et d'un compte Vercel et GitHub.

## 1. Créer le compte de service Google

1. Aller sur <https://console.cloud.google.com/> et créer un projet (par exemple « oliveraie-afourer »).
2. Menu **API et services → Bibliothèque** → chercher **Google Sheets API** → **Activer**.
3. Menu **API et services → Identifiants → Créer des identifiants → Compte de service**. Nom : `oliveraie-appli`. Terminer sans rôle particulier.
4. Cliquer sur le compte créé → onglet **Clés → Ajouter une clé → Créer une clé → JSON**. Un fichier `.json` se télécharge : **ne le partagez à personne et ne le mettez jamais dans git**.
5. Dans ce fichier, repérer deux valeurs :
   - `client_email` → c'est `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → c'est `GOOGLE_PRIVATE_KEY` (texte commençant par `-----BEGIN PRIVATE KEY-----`)

## 2. Partager le Google Sheet avec le compte de service

1. Ouvrir le Sheet « Appli Agricole – Base » (ID `1us3l2dEW8A5OhbMGd2Yijnf8AxTsLjXIcnpSNCn5E6U`).
2. **Partager** → coller l'adresse `client_email` → rôle **Éditeur** → décocher « Prévenir les personnes » → Partager.

## 3. Préparer le Sheet depuis votre ordinateur

Créer un fichier `.env.local` à la racine du projet (il n'est jamais envoyé sur git) :

```
DATA_SOURCE=sheets
SHEET_ID=1us3l2dEW8A5OhbMGd2Yijnf8AxTsLjXIcnpSNCn5E6U
GOOGLE_SERVICE_ACCOUNT_EMAIL=oliveraie-appli@....iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

(La clé sur une seule ligne, avec les retours à la ligne écrits `\n`.)

Puis :

```bash
npm run init-sheet
npm run seed-sheet
```

- `init-sheet` complète les onglets (formats, listes déroulantes, en-têtes figés) **sans rien écraser**.
- `seed-sheet` n'insère les données de départ que dans les onglets **vides** (le Sheet contient déjà vos données : il n'ajoutera donc rien).

## 4. Choisir les codes d'accès

```bash
npm run set-codes
```

Saisir le code famille (5 chiffres) et le code administrateur (8 caractères minimum). Le script affiche trois lignes `FAMILY_CODE_HASH=…`, `ADMIN_CODE_HASH=…`, `SESSION_SECRET=…` à copier dans `.env.local` **et** dans Vercel (étape 6). Changer un code plus tard déconnecte tout le monde.

## 5. Tester en local avec le vrai Sheet

```bash
npm run dev
```

Ouvrir <http://localhost:3000>, entrer le code, vérifier que les chiffres correspondent au Sheet (ventes encaissées, dépenses…).
Remplir la pluie historique dans le Sheet : `npm run rattrapage-pluie` (c'est un peu long, environ 14 appels à Open-Meteo).

Point GPS : remplacer `latitude` et `longitude` dans l'onglet **Parametres** par le point exact du terrain (les valeurs par défaut sont le centre d'Afourer).

## 6. Déployer sur Vercel

1. Mettre le projet sur GitHub (dépôt privé) : `git remote add origin …` puis `git push`.
2. Sur <https://vercel.com/new>, importer le dépôt (framework détecté : Next.js).
3. Dans **Settings → Environment Variables**, ajouter (environnement Production) :

| Nom | Valeur |
|---|---|
| `DATA_SOURCE` | `sheets` |
| `SHEET_ID` | l'identifiant du Sheet |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `client_email` du fichier JSON |
| `GOOGLE_PRIVATE_KEY` | `private_key` du fichier JSON (avec les `\n`) |
| `FAMILY_CODE_HASH`, `ADMIN_CODE_HASH`, `SESSION_SECRET` | sortie de `npm run set-codes` |
| `CRON_SECRET` | une longue suite de caractères au hasard (au moins 32) |

4. Lancer le déploiement (**Deploy**). Vercel donne une adresse `https://….vercel.app`.

## 7. Le cron de la pluie

Le fichier `vercel.json` programme déjà un appel quotidien (4 h) de `/api/cron/pluie`. Vercel envoie automatiquement `Authorization: Bearer <CRON_SECRET>`. Vérifier dans **Settings → Cron Jobs** qu'il est actif. Pour le tester à la main :

```bash
curl -H "Authorization: Bearer VOTRE_CRON_SECRET" https://VOTRE-APPLI.vercel.app/api/cron/pluie
```

Réponse attendue : un petit JSON avec le nombre de jours ajoutés.

## 8. Donner l'appli à la famille

Envoyer l'adresse et le code famille (jamais le code administrateur), puis le guide [guide-famille.md](guide-famille.md).

## Limites à connaître

- Le blocage anti-essais (5 erreurs → 15 min) est gardé en mémoire du serveur : sur Vercel, il est « au mieux ». Un code à 5 chiffres reste faible, mais l'appli ne contient que des montants familiaux.
- Le Sheet reste modifiable à la main : l'appli relit les données au plus tard après 60 secondes. Les lignes illisibles sont listées dans **Contrôle des données** (administrateur).
- Taux de change : Frankfurter ne publie pas le dirham ; l'appli utilise open.er-api.com (attribution ExchangeRate-API) puis un taux de secours modifiable dans `Parametres` (`taux_secours_eur_mad`).
