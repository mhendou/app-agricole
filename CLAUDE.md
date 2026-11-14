# Appli Agricole Afourer — Cahier des charges v0.2

Ce fichier est la référence du projet. À relire au début de chaque session.

## 1. Vision
Une appli familiale simple, belle et intuitive pour suivre l'oliveraie familiale d'Afourer (Maroc, 38 oliviers Picholine marocaine) : dépenses, ventes d'huile, récoltes depuis 2013, pluviométrie.
- Mhend (administrateur) saisit les données.
- Sa mère et ses deux sœurs consultent en lecture seule, surtout sur téléphone Android.
- Principe : **le Google Sheet est la base de données** (lisible et modifiable à la main) ; l'appli est une vitrine soignée avec une saisie guidée.

## 2. Décisions figées
| Sujet | Décision |
|---|---|
| Périmètre | Oliviers uniquement. Pas de potager, pas de nouvelles plantations ni projections en v1. |
| Calendrier | Année civile (janvier–décembre), vues annuelle et mensuelle. Exception : chaque **récolte** porte son « année de récolte » (une récolte faite en janvier 2026 = « Récolte 2025 »). |
| Accès | **Code d'accès, pas de compte Google.** Code famille à 5 chiffres = lecture seule. Code admin distinct (au moins 8 caractères) = lecture + écriture. |
| Dépenses | Toutes payées par Mhend, aucune répartition entre personnes. Saisie manuelle des montants. |
| Ventes | Uniquement l'huile d'olive, vendue après la récolte. Environ 100 DH/L au Maroc, 12 €/L hors Maroc (transport inclus). |
| Devises | Tout s'affiche en DH. Une vente hors Maroc se saisit en € et se convertit en DH au taux du jour, **figé dans la ligne** à la saisie (modifiable). |
| Langue | Français uniquement. |
| Données | Google Sheet modifiable directement ; toute modification apparaît dans l'appli (cache de 60 s maximum). |
| Plateformes | Une seule **web app installable (PWA)** : Android d'abord, iPhone, ordinateur. Pas de boutique d'applications en v1. |
| Météo | Module accessoire : pluviométrie d'Afourer historisée (Open-Meteo) + lien vers Meteoblue. |
| Hors appli | Comptes personnels entre membres de la famille, ancienne répartition avec Mohamed. |

## 3. Design : épuré, moderne, agricole, chaleureux
Inspiration : les paysages d'Afourer au pied du Moyen Atlas, la terre ocre, l'argile, le feuillage argenté de l'olivier, la lumière dorée de fin de journée.
- Beaucoup d'espace, peu d'éléments par écran, grandes cartes de chiffres, coins arrondis 16–20 px, ombres très légères, pas de bordures lourdes.
- Palette (jetons CSS / Tailwind) :
  - `sable` #F6F1E7 (fond) · `creme` #FFFDF8 (cartes) · `pierre` #8A7B66 (texte secondaire) · `encre` #2A2722 (texte)
  - `olive` #5E6B2E (ventes, positif) · `olive-fonce` #3B4520 (titres, carte Solde) · `sauge` #A3AD86 (feuillage, fonds doux)
  - `argile` #B4532A (dépenses) · `ocre` #D9A441 (accents, soleil, alertes douces) · `ciel` #5A8BA8 (pluie, météo uniquement)
- Typographie (next/font, auto-hébergée) : titres et grands chiffres en **Fraunces** ; texte en **Inter**. Taille minimale 16 px, chiffres tabulaires.
- Pictos : icônes au trait fin (lucide-react) et quelques illustrations SVG simples faites maison (rameau d'olivier, goutte, soleil, montagne) dans la palette. Pas d'images lourdes.
- Contraste conforme WCAG AA, cibles tactiles ≥ 44 px, aucune action cachée derrière un geste.
- Formats : « 10 680 DH » (espace insécable comme séparateur de milliers), « 13 avr. 2026 », « 3 929 kg », « 711 L ».
- Mobile : barre d'onglets en bas. Ordinateur (≥ 1024 px) : menu latéral + mise en page en grille sur 2–3 colonnes.
- Petites animations discrètes (apparition des cartes, croissance des barres), désactivées si `prefers-reduced-motion`.

## 4. Écrans v1
Sélecteur d'année en haut de chaque écran (année en cours par défaut).
1. **Accueil** : 3 grandes cartes (Ventes encaissées, Dépenses, Solde), barre « les dépenses représentent X % des ventes », histogramme mensuel ventes/dépenses, carte « dernière récolte » (kg, litres, rendement, écart vs récolte précédente), petite carte météo (pluie cumulée de l'année).
2. **Dépenses** : liste groupée par mois, picto de catégorie, total, répartition par catégorie (barres horizontales plutôt que camembert). Admin : bouton « + ».
3. **Ventes** : liste avec badges de statut (payé, à encaisser, offert), litres vendus, prix moyen au litre, répartition Maroc / hors Maroc, montant à encaisser mis en évidence. Admin : formulaire avec bascule DH / €.
4. **Récoltes** : histogramme 2013 → aujourd'hui (vert olive), record, moyenne, rendement huile, kg par arbre. Une année sans donnée s'affiche « donnée perdue » (barre hachurée grise), distincte d'une année à 0 kg. Admin : ajouter ou corriger une année.
5. **Météo (accessoire)** : pluie par mois et par année, prévision des 7 prochains jours, bouton « Ouvrir Meteoblue », mention « données modélisées Open-Meteo.com ».
6. **Récap partageable** : bouton « Partager le récap de l'année » qui génère une image (PNG) dans le style de l'appli et ouvre le partage natif (WhatsApp).
7. **Admin uniquement** : « Contrôle des données » (lignes invalides ou incomplètes) et bouton « Ouvrir le Google Sheet ».
8. **Écran de code** : grand clavier numérique à 5 chiffres, logo rameau d'olivier, message clair si le code est faux. Lien discret « Accès administrateur » pour saisir le code admin.

## 5. Modèle de données (Google Sheet « Appli Agricole – Base »)
**Le Sheet existe déjà et contient les données de départ** : ID `1us3l2dEW8A5OhbMGd2Yijnf8AxTsLjXIcnpSNCn5E6U` (à mettre comme valeur de `SHEET_ID` dans `.env.example`). Onglets : Depenses, Ventes, Recoltes, Pluie, Parametres, Lisez-moi. Les ids existants sont D001…D009 et V001…V022. Le script `init-sheet` doit donc seulement compléter (formats, listes déroulantes, protection des en-têtes) sans rien écraser ; `seed-sheet` ne doit rien insérer si les onglets contiennent déjà des données.
Une ligne = un enregistrement. En-têtes figés en ligne 1. Le code retrouve les colonnes **par leur nom**, jamais par position. Listes déroulantes pour catégories, statuts, devises. Dates réelles sans heure.

**`Depenses`** : `id · date · categorie · description · beneficiaire · montant_dh · mode_paiement · note`
Catégories : Irrigation · Facture d'eau · Main-d'œuvre · Engrais & intrants · Récolte & moulin · Conditionnement · Gardiennage & animaux · Matériel & entretien · Autre. Modes : virement · cash.

**`Ventes`** : `id · date · client · ville · pays · litres · prix_unitaire · devise · taux_eur_mad · montant_dh · statut · mode_encaissement · note`
Devise : MAD · EUR. Statut : payé · à encaisser · offert. `montant_dh` est stocké : c'est la valeur de référence (il peut différer de litres × prix si Mhend l'a corrigé).

**`Recoltes`** : `annee_recolte · kg_olives · litres_huile · date_recolte · note`
Cellule `kg_olives` vide = donnée perdue ; 0 = pas de récolte.

**`Pluie`** : `date · pluie_mm · temp_max · temp_min · source · pluie_mm_mesuree` (un relevé manuel, s'il existe, prime sur la donnée modélisée).

**`Parametres`** : clé / valeur (`nb_oliviers` = 38, `latitude`, `longitude`, `nom_exploitation`, `lien_meteoblue`, `taux_secours_eur_mad`).

Données de départ : fichiers CSV dans `/data` (récoltes 2013–2025, ventes et dépenses 2026).
Repères pour les tests : moyenne des récoltes 2013–2025 hors 2015 = 1 844 kg ; 2025 = 3 929 kg et 711 L (total broyé), rendement 18,1 % ; 2025 est la 2e meilleure année après 2017 (3 948 kg) ; ventes 2026 encaissées = 10 680 DH ; dépenses 2026 = 8 631 DH.

## 6. Indicateurs
- Année : ventes encaissées, à encaisser, dépenses, solde, litres vendus, litres offerts, prix moyen au litre, dépenses par catégorie et par mois.
- Récoltes : kg, litres, rendement (litres ÷ kg), kg par arbre, écart vs année précédente, moyenne et record (en ignorant les années perdues).
- Sous la carte Solde, une note discrète : « Solde de trésorerie de l'année : les ventes viennent souvent de la récolte précédente. »

## 7. Météo
- Open-Meteo (gratuit, usage non commercial, sans clé ; attribution « Open-Meteo.com » obligatoire). Prévision : `api.open-meteo.com/v1/forecast` ; historique : `archive-api.open-meteo.com/v1/archive`.
- Route cron quotidienne protégée par `CRON_SECRET` qui ajoute les derniers jours dans `Pluie` sans doublons ; script de rattrapage depuis le 1er janvier 2013.
- Coordonnées par défaut : latitude 32.21, longitude -6.54 (centre d'Afourer, **à remplacer** par le point GPS exact du terrain dans `Parametres`).
- Bonus : graphique pluie annuelle vs production, présenté comme indicatif.

## 8. Devises
- Taux EUR → MAD à la saisie via l'API Frankfurter (sans clé), repli sur open.er-api.com (attribution requise), puis sur `taux_secours_eur_mad`. Cache de 12 h. Taux stocké dans la ligne, modifiable.

## 9. Accès par code
- Variables d'environnement serveur : `FAMILY_CODE_HASH` (5 chiffres, haché), `ADMIN_CODE_HASH` (haché), `SESSION_SECRET`.
- Script `npm run set-codes` qui demande les codes et affiche les hachages à coller dans `.env.local` et dans Vercel.
- Cookie de session signé, httpOnly, secure, SameSite=Lax, valable 180 jours, contenant le rôle et une version de code (changer un code déconnecte tout le monde).
- Anti-force brute : 5 essais faux → blocage 15 min (par IP + empreinte d'appareil), délai progressif. Un code à 5 chiffres reste faible : l'appli ne contient aucune donnée bancaire, seulement des montants familiaux.
- **Toute écriture est vérifiée côté serveur** (rôle admin), pas seulement masquée dans l'interface.

## 10. Architecture technique
- Next.js (App Router, TypeScript strict), Tailwind CSS, Recharts, lucide-react, zod. Tests : Vitest (unitaires) et Playwright (parcours principaux). Déploiement prévu sur Vercel (plan gratuit).
- Couche de données derrière une interface unique `DataSource` avec deux implémentations :
  - `mock` : lit et écrit des fichiers JSON locaux dans `.data-local/` initialisés depuis `/data/*.csv` (utilisé par défaut en développement et dans les tests) ;
  - `sheets` : API Google Sheets via compte de service (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `SHEET_ID`), lecture groupée `batchGet` en `UNFORMATTED_VALUE`, cache serveur 60 s, écriture par `id`.
  - Choix par la variable `DATA_SOURCE=mock|sheets`.
- Parsing tolérant (virgule décimale, dates texte ou numéro de série, lignes vides, colonnes ajoutées). Une ligne invalide ne fait jamais planter l'appli : elle est ignorée et listée dans « Contrôle des données ».
- PWA : manifest, icônes, service worker qui garde les dernières données consultées avec la mention « dernière mise à jour ».
- Fuseau Africa/Casablanca pour « aujourd'hui ». Aucune clé ni secret côté client.

## 11. Hors périmètre v1
Lecture automatique des photos WhatsApp, nouvelles plantations et projections, rentabilité par récolte, stock d'huile, boutiques d'applications.

## 12. Règles de travail pour Claude Code (mode autonome de nuit)
- Ne jamais poser de question ni attendre de validation : choisir l'option la plus raisonnable, l'écrire dans `DECISIONS.md`, continuer.
- Travailler uniquement dans le dossier du projet. Ne rien installer globalement, ne jamais utiliser sudo, ne rien supprimer hors du projet.
- Pas de déploiement, pas de `git push`, aucun appel à un service qui demande une clé ou un compte. Les appels Open-Meteo et Frankfurter sont autorisés.
- Ne jamais écrire de secret dans le code ni dans git. Utiliser `.env.example`.
- Suivre `TACHES.md` dans l'ordre ; après chaque tâche : `npm run check` (lint + types + tests + build) doit passer, puis commit git, puis case cochée et une ligne dans `JOURNAL.md`.
- Si une tâche échoue 3 fois, la marquer `⚠️ bloquée` avec l'explication, et passer à la suivante.
