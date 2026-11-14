# Lancement autonome de Claude Code pour la nuit.
# Usage, depuis le dossier du projet :  powershell -ExecutionPolicy Bypass -File .\nuit.ps1
# Le script relance Claude Code tant que TACHES.md ne contient pas "TOUT EST TERMINE",
# attend 30 min si une session s'arrete vite (limite d'usage atteinte), et garde le PC eveille.

$ErrorActionPreference = "Continue"
$MaxSessions = 30          # securite : nombre maximum de sessions
$HeureLimite = (Get-Date).AddHours(11)
New-Item -ItemType Directory -Force -Path ".\logs" | Out-Null

# Empeche la mise en veille tant que ce script tourne (pas besoin d'etre administrateur)
Add-Type -Namespace Win32 -Name Power -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint esFlags);'
[Win32.Power]::SetThreadExecutionState([uint32]"0x80000003") | Out-Null   # ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED

function Termine {
    if (-not (Test-Path ".\TACHES.md")) { return $false }
    $txt = Get-Content ".\TACHES.md" -Raw -Encoding UTF8
    return ($txt -match "TOUT EST TERMIN")
}

for ($i = 1; $i -le $MaxSessions; $i++) {
    if (Termine) { Write-Host "Toutes les taches sont terminees." -ForegroundColor Green; break }
    if ((Get-Date) -gt $HeureLimite) { Write-Host "Heure limite atteinte." -ForegroundColor Yellow; break }

    $stamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
    $log = ".\logs\session-$i-$stamp.log"
    Write-Host "[$(Get-Date -Format HH:mm)] Session $i ... (journal : $log)" -ForegroundColor Cyan
    $debut = Get-Date

    claude -p "Lis le fichier PROMPT-NUIT.md a la racine du projet et suis exactement ses instructions." --dangerously-skip-permissions --output-format text *>&1 | Tee-Object -FilePath $log

    $duree = ((Get-Date) - $debut).TotalMinutes
    Write-Host "[$(Get-Date -Format HH:mm)] Session $i finie apres $([math]::Round($duree)) min." -ForegroundColor Cyan

    if (Termine) { continue }
    if ($duree -lt 3) {
        Write-Host "Session tres courte (probablement une limite d'usage). Pause de 30 min." -ForegroundColor Yellow
        Start-Sleep -Seconds 1800
    } else {
        Start-Sleep -Seconds 20
    }
}

[Win32.Power]::SetThreadExecutionState([uint32]"0x80000000") | Out-Null   # retour au comportement normal
Write-Host "Fin du script. Lis RAPPORT-MATIN.md." -ForegroundColor Green
