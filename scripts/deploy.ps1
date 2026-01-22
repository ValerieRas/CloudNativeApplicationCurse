param (
    [string]$DockerUser,
    [string]$GitSha
)

# 1. Déterminer la couleur active et la cible
$ActiveColorFile = ".active_color"
$CurrentColor = "blue"

if (Test-Path $ActiveColorFile) {
    $CurrentColor = Get-Content $ActiveColorFile
}

if ($CurrentColor -eq "blue") {
    $TargetColor = "green"
} else {
    $TargetColor = "blue"
}

Write-Host "--- DEPLOYMENT START ---"
Write-Host "Current Color: $CurrentColor"
Write-Host "Target Color : $TargetColor"

# 2. Préparer les images
Write-Host "Pulling images for commit $GitSha..."
docker pull "$DockerUser/cloudnative-backend:$GitSha"
docker pull "$DockerUser/cloudnative-frontend:$GitSha"

Write-Host "Retagging images to :$TargetColor..."
docker tag "$DockerUser/cloudnative-backend:$GitSha" "cloudnative-backend:$TargetColor"
docker tag "$DockerUser/cloudnative-frontend:$GitSha" "cloudnative-frontend:$TargetColor"


if ([string]::IsNullOrWhiteSpace($TargetColor)) {
    Write-Error "CRITICAL: TargetColor is empty! Logic failed."
    exit 1
}

# 3. [FIX] Préparer la config Nginx AVANT de démarrer (pour éviter le crash)
Write-Host "Configuring Nginx for target: $TargetColor"
$NginxConfigContent = "set `$active_backend `"app-front-${TargetColor}:80`";"
$NginxConfigFile = "./nginx/conf.d/active_upstream.conf"

# S'assurer que le dossier existe
$ParentDir = Split-Path -Parent $NginxConfigFile
if (-not (Test-Path $ParentDir)) {
    New-Item -ItemType Directory -Force -Path $ParentDir | Out-Null
}
# Créer le fichier
$NginxConfigContent | Out-File -FilePath $NginxConfigFile -Encoding ascii


# 4. Démarrer l'infrastructure
Write-Host "Starting Base Infra and $TargetColor stack..."

# Création sécurisée du réseau
if (-not (docker network ls -q -f name=bluegreen-net)) {
    docker network create bluegreen-net
}

# Lancement des conteneurs
docker-compose -f docker-compose.base.yml -f "docker-compose.$TargetColor.yml" up -d

# 5. Wait
Write-Host "Waiting for $TargetColor to be ready..."
Start-Sleep -Seconds 15 

# 6. Reload Nginx (Juste pour être sûr que la config est prise en compte)
Write-Host "Reloading Nginx..."
# Correction : Filtre simplifié (plus de regex ^/ qui bug sur Windows)
$ProxyId = docker ps -q -f "name=reverse-proxy"

if ($ProxyId) {
    Write-Host "Container found ($ProxyId). Reloading config..."
    docker exec reverse-proxy nginx -s reload
    Write-Host "Traffic is now on $TargetColor."
} else {
    Write-Warning "Container 'reverse-proxy' not found via filter."
    Write-Warning "Listing all containers for debug:"
    docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}"
    # On ne quitte pas en erreur ici car le conteneur a peut-être redémarré tout seul avec la nouvelle conf
}

# 7. Mise à jour de l'état
$TargetColor | Out-File -FilePath $ActiveColorFile -Encoding ascii

# 8. Arrêt de l'ancienne couleur
Write-Host "Stopping $CurrentColor stack..."
try {
    docker-compose -f "docker-compose.$CurrentColor.yml" stop 2>$null
} catch {
    Write-Host "Previous stack not running."
}

Write-Host "--- DEPLOYMENT SUCCESS ---"
exit 0