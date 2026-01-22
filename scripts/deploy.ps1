param (
    [string]$DockerUser,
    [string]$GitSha
)

# 1. Déterminer la couleur
$ActiveColorFile = ".active_color"
$CurrentColor = "blue"

if (Test-Path $ActiveColorFile) {
    $CurrentColor = Get-Content $ActiveColorFile
}

if ($CurrentColor -eq "blue") { $TargetColor = "green" } else { $TargetColor = "blue" }

Write-Host "--- DEPLOYMENT START ---"
Write-Host "Current: $CurrentColor -> Target: $TargetColor"

# 2. Pull & Tag
Write-Host "Pulling images..."
docker pull "$DockerUser/cloudnative-backend:$GitSha"
docker pull "$DockerUser/cloudnative-frontend:$GitSha"

docker tag "$DockerUser/cloudnative-backend:$GitSha" "cloudnative-backend:$TargetColor"
docker tag "$DockerUser/cloudnative-frontend:$GitSha" "cloudnative-frontend:$TargetColor"

# 3. Préparer config (sans l'écrire encore)
$NginxConfigContent = "set `$active_backend `"app-front-${TargetColor}:80`";"
$NginxConfigFile = "./nginx/conf.d/active_upstream.conf"

# Assurer dossier existe
$ParentDir = Split-Path -Parent $NginxConfigFile
if (-not (Test-Path $ParentDir)) { New-Item -ItemType Directory -Force -Path $ParentDir | Out-Null }

# Cas particulier : Premier run (si pas de config, on l'écrit pour que Nginx démarre)
if (-not (Test-Path $NginxConfigFile)) {
    $NginxConfigContent | Out-File -FilePath $NginxConfigFile -Encoding ascii
}

# 4. Démarrer la nouvelle couleur
Write-Host "Starting $TargetColor stack..."
if (-not (docker network ls -q -f name=bluegreen-net)) { docker network create bluegreen-net }

docker-compose -f docker-compose.base.yml -f "docker-compose.$TargetColor.yml" up -d

# ==============================================================================
# 5. HEALTHCHECK AUTOMATIQUE (Le "Rollback" préventif)
# ==============================================================================
Write-Host "Testing health of $TargetColor before switching..."

$MaxRetries = 12  # On attend 60 secondes max (12 x 5s)
$Retry = 0
$IsHealthy = $false

while ($Retry -lt $MaxRetries) {
    Start-Sleep -Seconds 5
    
    # On demande au proxy de tester la connexion vers le nouveau front (wget est inclus dans alpine)
    # --spider vérifie juste si la page existe (sans télécharger)
    docker exec reverse-proxy wget --spider -q "http://app-front-${TargetColor}:80"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Healthcheck OK: $TargetColor is responding!"
        $IsHealthy = $true
        break
    } else {
        Write-Host "⏳ Waiting for $TargetColor to be ready... ($Retry/$MaxRetries)"
    }
    $Retry++
}

if (-not $IsHealthy) {
    Write-Error "❌ CRITICAL: $TargetColor failed to start. Aborting deployment."
    
    # NETTOYAGE (ROLLBACK AUTOMATIQUE)
    Write-Host "🛑 Stopping broken $TargetColor containers..."
    docker-compose -f "docker-compose.$TargetColor.yml" stop
    
    Write-Host "⚠️ Traffic remains on $CurrentColor. No downtime occurred."
    exit 1 # Fait échouer le pipeline CI
}

# ==============================================================================
# 6. Bascule du trafic (Uniquement si Healthcheck OK)
# ==============================================================================
Write-Host "Switching Nginx traffic to $TargetColor..."

# Écriture de la nouvelle config
$NginxConfigContent | Out-File -FilePath $NginxConfigFile -Encoding ascii

# Reload Nginx
$ProxyId = docker ps -q -f "name=reverse-proxy"
if ($ProxyId) {
    docker exec reverse-proxy nginx -s reload
    Write-Host "Traffic is now on $TargetColor."
} else {
    Write-Warning "Proxy container not found (weird)."
}

# 7. Mise à jour état
$TargetColor | Out-File -FilePath $ActiveColorFile -Encoding ascii

# 8. On laisse l'ancienne couleur tourner (pour rollback manuel futur)
Write-Host "--- DEPLOYMENT SUCCESS ($CurrentColor kept as backup) ---"
exit 0