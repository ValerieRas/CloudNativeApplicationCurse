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

# 3. Démarrer l'infrastructure
Write-Host "Starting Base Infra and $TargetColor stack..."

# [FIX] Création sécurisée du réseau (Idempotent)
if (-not (docker network ls -q -f name=bluegreen-net)) {
    Write-Host "Creating network bluegreen-net..."
    docker network create bluegreen-net
} else {
    Write-Host "Network bluegreen-net already exists."
}

docker-compose -f docker-compose.base.yml -f "docker-compose.$TargetColor.yml" up -d

# 4. Wait
Write-Host "Waiting for $TargetColor to be ready..."
Start-Sleep -Seconds 15 

# 5. Bascule du trafic (Switch Nginx)
Write-Host "Switching Nginx traffic to $TargetColor..."

$NginxConfigContent = "set `$active_backend `"app-front-$TargetColor:80`";"
$NginxConfigFile = "./nginx/conf.d/active_upstream.conf"

# [FIX] S'assurer que le dossier parent existe avant d'écrire le fichier
$ParentDir = Split-Path -Parent $NginxConfigFile
if (-not (Test-Path $ParentDir)) {
    Write-Host "Creating directory $ParentDir..."
    New-Item -ItemType Directory -Force -Path $ParentDir | Out-Null
}

# Écriture dans le fichier
$NginxConfigContent | Out-File -FilePath $NginxConfigFile -Encoding ascii

# [FIX] Recharger Nginx uniquement si le conteneur tourne
if (docker ps -q -f name=reverse-proxy) {
    Write-Host "Reloading Nginx config..."
    docker exec reverse-proxy nginx -s reload
} else {
    Write-Error "CRITICAL: Container 'reverse-proxy' is not running! Cannot switch traffic."
    exit 1
}

Write-Host "Traffic is now on $TargetColor."

# 6. Mise à jour de l'état
$TargetColor | Out-File -FilePath $ActiveColorFile -Encoding ascii

# 7. Arrêt de l'ancienne couleur
Write-Host "Stopping $CurrentColor stack..."
# [FIX] Ajout de 'ErrorAction SilentlyContinue' pour ne pas planter si c'est le 1er run
try {
    docker-compose -f "docker-compose.$CurrentColor.yml" stop 2>$null
} catch {
    Write-Host "Warning: Could not stop $CurrentColor stack (maybe it wasn't running)."
}

Write-Host "--- DEPLOYMENT SUCCESS ---"