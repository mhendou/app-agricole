# Le Google Sheet « Appli Agricole – Base »

Le Sheet est la base de données : on peut le lire et le modifier à la main, l'appli le relit (cache de 60 secondes au maximum).

ID du Sheet : `1us3l2dEW8A5OhbMGd2Yijnf8AxTsLjXIcnpSNCn5E6U` (variable `SHEET_ID`).

## Onglets et colonnes
Une ligne = un enregistrement, en-têtes en ligne 1. L'appli retrouve les colonnes **par leur nom** : on peut les déplacer ou en ajouter, mais pas renommer les en-têtes.

| Onglet | Colonnes |
|---|---|
| Depenses | id, date, categorie, description, beneficiaire, montant_dh, mode_paiement, note |
| Ventes | id, date, client, ville, pays, litres, prix_unitaire, devise, taux_eur_mad, montant_dh, statut, mode_encaissement, note |
| Recoltes | annee_recolte, kg_olives, litres_huile, date_recolte, note |
| Pluie | date, pluie_mm, temp_max, temp_min, source, pluie_mm_mesuree |
| Parametres | cle, valeur |

Règles utiles : `kg_olives` vide = donnée perdue, 0 = pas de récolte ; `montant_dh` est la valeur de référence d'une vente ; un relevé de pluie saisi dans `pluie_mm_mesuree` prime sur la donnée modélisée.
Une ligne illisible est ignorée par l'appli et listée dans « Contrôle des données » (administrateur).

## Scripts (non exécutés automatiquement)
Prérequis : `.env.local` avec `SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, et le Sheet partagé en **Éditeur** avec l'adresse du compte de service (voir `docs/mise-en-ligne.md`).

- `npm run init-sheet` : crée les onglets manquants, complète les en-têtes manquants, fige la ligne 1, applique formats de date/nombre, listes déroulantes (non bloquantes) et protection d'avertissement des en-têtes. Idempotent, n'écrase rien.
- `npm run seed-sheet` : charge `/data/*.csv` (récoltes 2013–2025, ventes et dépenses 2026) dans les onglets **vides** uniquement.
