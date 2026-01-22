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

# 2. Préparer les images (Pull SHA spécifique -> Tag Blue/Green)
Write-Host "Pulling images for commit $GitSha..."
docker pull "$DockerUser/cloudnative-backend:$GitSha"
docker pull "$DockerUser/cloudnative-frontend:$GitSha"

Write-Host "Retagging images to :$TargetColor..."
docker tag "$DockerUser/cloudnative-backend:$GitSha" "cloudnative-backend:$TargetColor"
docker tag "$DockerUser/cloudnative-frontend:$GitSha" "cloudnative-frontend:$TargetColor"

# 3. Démarrer l'infrastructure de base (si pas lancée) et la nouvelle couleur
Write-Host "Starting Base Infra and $TargetColor stack..."
# On s'assure que le réseau existe
docker network create bluegreen-net 2>$null
docker-compose -f docker-compose.base.yml -f "docker-compose.$TargetColor.yml" up -d

# 4. Wait / Healthcheck (Simplifié)
Write-Host "Waiting for $TargetColor to be ready..."
Start-Sleep -Seconds 15 
# Idéalement, faire une boucle curl sur le conteneur front-green ou front-blue

# 5. Bascule du trafic (Switch Nginx)
Write-Host "Switching Nginx traffic to $TargetColor..."

# Création du contenu de configuration Nginx
$NginxConfigContent = "set `$active_backend `"app-front-$TargetColor:80`";"
$NginxConfigFile = "./nginx/conf.d/active_upstream.conf"

# Écriture dans le fichier local (qui est monté dans le volume Nginx)
$NginxConfigContent | Out-File -FilePath $NginxConfigFile -Encoding ascii

# Recharger Nginx
docker exec reverse-proxy nginx -s reload
Write-Host "Nginx reloaded. Traffic is now on $TargetColor."

# 6. Mise à jour de l'état
$TargetColor | Out-File -FilePath $ActiveColorFile -Encoding ascii

# 7. (Optionnel) Arrêt de l'ancienne couleur
Write-Host "Stopping $CurrentColor stack..."
docker-compose -f "docker-compose.$CurrentColor.yml" stop

Write-Host "--- DEPLOYMENT SUCCESS ---"