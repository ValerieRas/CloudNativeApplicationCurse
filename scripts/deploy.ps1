param (
    [string]$DockerUser,
    [string]$GitSha
)

$ErrorActionPreference = "Stop"

# 1. Détecter l'état actuel
$ActiveConfPath = "./nginx/conf.d/active.conf"
$ActiveContent = Get-Content $ActiveConfPath

if ($ActiveContent -match "backend_blue") {
    $CurrentColor = "blue"
    $NextColor = "green"
} else {
    $CurrentColor = "green"
    $NextColor = "blue"
}

Write-Host "Production actuelle : $CurrentColor. Déploiement vers : $NextColor..."

# 2. Préparation et démarrage de la nouvelle couleur
docker pull "${DockerUser}/cloudnative-backend:$GitSha"
docker pull "${DockerUser}/cloudnative-frontend:$GitSha"
docker tag "${DockerUser}/cloudnative-backend:$GitSha" "cloudnative-backend:$NextColor"
docker tag "${DockerUser}/cloudnative-frontend:$GitSha" "cloudnative-frontend:$NextColor"

# On lance la nouvelle couleur sans couper l'ancienne
docker-compose -f docker-compose.base.yml -f "docker-compose.$NextColor.yml" up -d

# 3. Vérification si les nouveaux conteneurs tournent réellement
Write-Host "Vérification du statut des conteneurs $NextColor..."
Start-Sleep -Seconds 5 # Laisse un court délai pour le démarrage

$NewContainers = @("app-back-$NextColor", "app-front-$NextColor")
$DeploymentFailed = $false

foreach ($Name in $NewContainers) {
    $Status = docker inspect --format='{{.State.Status}}' $Name
    Write-Host "Conteneur $Name est dans l'état : $Status"
    if ($Status -ne "running") {
        $DeploymentFailed = $true
    }
}

# 4. Bascule ou Rollback
if ($DeploymentFailed -eq $false) {
    Write-Host "Succès : La nouvelle couleur est opérationnelle. Bascule du trafic..."
    
    # Mise à jour de la config Nginx
    $NewConfig = "set `$active_backend backend_$NextColor;`nset `$active_frontend frontend_$NextColor;"
    $NewConfig | Out-File -FilePath $ActiveConfPath -Encoding utf8
    
    # Rechargement à chaud
    docker exec reverse-proxy nginx -s reload
    Write-Host "--- Déploiement $NextColor terminé avec succès ---"
} 
else {
    Write-Warning "CRITIQUE : Les conteneurs $NextColor n'ont pas démarré. Annulation de la bascule."
    
    # Ici, le rollback est passif : on ne touche pas à active.conf
    # L'ancien trafic reste sur $CurrentColor car Nginx n'a pas été rechargé.
    
    # Optionnel : On nettoie la version défaillante
    docker-compose -f docker-compose.base.yml -f "docker-compose.$NextColor.yml" stop
    
    Write-Host "Le système est resté sur la version stable ($CurrentColor)."
    exit 1 # Échec du pipeline pour alerter l'équipe
}