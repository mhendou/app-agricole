# Lancer Claude Code pour la nuit — pas à pas (Windows)

Durée : 15 à 20 minutes avant d'aller dormir.

## Ce que la nuit va produire
L'appli complète qui tourne sur ton PC avec tes vraies données 2026 et ton historique de récoltes, en **mode local** (`DATA_SOURCE=mock`). Le branchement au Google Sheet et la mise en ligne demandent tes identifiants Google et Vercel : on les fera demain matin en 20 minutes, en suivant `docs/mise-en-ligne.md` que Claude Code aura écrit.

## 1. Vérifier les outils (5 min)
Ouvre **PowerShell** (touche Windows, tape « PowerShell ») et lance :
```
node --version
git --version
claude --version
```
- Si `node` manque : installe **Node.js LTS** depuis nodejs.org, puis rouvre PowerShell.
- Si `git` manque : installe **Git for Windows** depuis git-scm.com (options par défaut).
- Si `claude` manque : installe Claude Code avec la commande de la page officielle https://code.claude.com/docs/en/setup, puis lance `claude` une fois pour te connecter, et `/exit`.
- Lance aussi `claude doctor` : il doit dire que tout va bien.

## 2. Préparer le dossier (3 min)
1. Crée un dossier, par exemple `C:\Projets\appli-agricole` (**pas** dans OneDrive, Bureau ou Documents synchronisés).
2. Décompresse dedans le contenu du kit : `CLAUDE.md`, `TACHES.md`, `PROMPT-NUIT.md`, `nuit.ps1`, `GUIDE-LANCEMENT.md` et le dossier `data`.
3. Dans PowerShell :
```
cd C:\Projets\appli-agricole
git init
git add .
git commit -m "Kit de départ"
```
(Si git demande ton nom et ton e-mail, fais les deux commandes `git config --global user.name "Mhend"` et `git config --global user.email "ton-email"` qu'il propose, puis relance le commit.)

## 3. Préparer le PC pour la nuit (3 min)
- **Branche le chargeur.**
- Paramètres → Windows Update → **Suspendre les mises à jour pendant 1 semaine** (sinon un redémarrage peut tout couper).
- Paramètres → Système → Alimentation : mise en veille sur secteur = **Jamais** (le script empêche déjà la veille, c'est une sécurité de plus).
- Si c'est un portable : ne ferme pas le capot (ou règle « Fermer le capot : ne rien faire » sur secteur).
- Ferme les applications lourdes (jeux, montage vidéo).

## 4. Test de 2 minutes avant de partir
```
claude -p "Dis bonjour et liste les fichiers du dossier." --dangerously-skip-permissions
```
Tu dois voir une réponse avec la liste des fichiers, sans aucune question. Si on te demande de te connecter, fais-le maintenant.

## 5. Lancer la nuit
```
powershell -ExecutionPolicy Bypass -File .\nuit.ps1
```
Laisse la fenêtre ouverte et va dormir. Le script :
- relance Claude Code session après session jusqu'à ce que les 22 tâches soient faites ;
- attend 30 minutes et réessaie si ta limite d'usage Claude est atteinte (fréquent avec un abonnement Pro sur une longue nuit ; Max va plus loin) ;
- s'arrête au bout de 11 heures maximum ;
- garde un journal de chaque session dans `logs\`.

## 6. Demain matin
1. Lis `RAPPORT-MATIN.md` (et `TACHES.md` pour voir ce qui est coché).
2. Lance `npm run dev`, ouvre http://localhost:3000, entre le code `12345`. Pour l'accès admin, le code est `admin-olive-2026`.
3. On fait ensemble la mise en ligne : Google Sheet, codes définitifs, Vercel, et le message WhatsApp pour ta mère et tes sœurs.

## À savoir sur le mode sans validation
`--dangerously-skip-permissions` autorise Claude Code à exécuter toutes ses commandes sans te demander. C'est ce qui permet de dormir, mais il agit avec tes droits sur le PC. Les garde-fous : il travaille dans un dossier dédié, `CLAUDE.md` lui interdit de sortir du projet, de déployer ou de pousser du code, et aucun secret n'est présent sur le disque cette nuit. Pour plus de sécurité, tu peux lancer le tout dans WSL ou dans une session Windows séparée.
