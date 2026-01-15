param (
    [string]$DockerUser,
    [string]$GitSha
)

$ErrorActionPreference = "Stop"

Write-Host "--- Starting Blue-Green Deployment for SHA: $GitSha ---"

# 1. Déterminer la couleur active actuelle via Nginx
# On vérifie quel fichier est actuellement pointé dans la config montée
$ActiveConfPath = "./nginx/conf.d/active.conf"
$ActiveContent = Get-Content $ActiveConfPath

if ($ActiveContent -match "backend_blue") {
    $CurrentColor = "blue"
    $NextColor = "green"
} else {
    $CurrentColor = "green"
    $NextColor = "blue"
}

Write-Host "Current active color is $CurrentColor. Deploying to $NextColor..."

# 2. Pull des images spécifiques
Write-Host "Pulling images for $NextColor..."
docker pull "${DockerUser}/cloudnative-backend:$GitSha"
docker pull "${DockerUser}/cloudnative-frontend:$GitSha"

# 3. Re-tagging vers la couleur cible (au lieu de 'latest')
# Cela permet d'alimenter les images utilisées dans vos fichiers compose spécifiques
docker tag "${DockerUser}/cloudnative-backend:$GitSha" "cloudnative-backend:$NextColor"
docker tag "${DockerUser}/cloudnative-frontend:$GitSha" "cloudnative-frontend:$NextColor"

# 4. Déployer la couleur cible (sans toucher à la couleur active)
Write-Host "Starting $NextColor containers..."
docker-compose -f docker-compose.base.yml -f "docker-compose.$NextColor.yml" up -d

# 5. Attendre que le nouveau service soit prêt (Healthcheck simplifié)
Write-Host "Waiting for $NextColor to be ready..."
Start-Sleep -Seconds 15

# 6. Mise à jour de la configuration Nginx (La Bascule)
Write-Host "Switching Nginx traffic to $NextColor..."
$NewConfig = @"
set `$active_backend backend_$NextColor;
set `$active_frontend frontend_$NextColor;
"@
$NewConfig | Out-File -FilePath $ActiveConfPath -Encoding utf8

# 7. Reload Nginx sans interruption
docker exec reverse-proxy nginx -s reload

Write-Host "--- Deployment Successful: $NextColor is now live ---"