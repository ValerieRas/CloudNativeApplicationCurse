param (
    [string]$DockerUser,
    [string]$GitSha
)

# ==============================================================================
# 1. DÉTERMINER LA COULEUR ACTIVE (SOURCE DE VÉRITÉ : LE PROXY)
# ==============================================================================
$CurrentColor = "blue" # Valeur par défaut

# On demande au proxy ce qu'il utilise actuellement
try {
    if (docker ps -q -f "name=reverse-proxy") {
        $ProxyConfig = docker exec reverse-proxy cat /etc/nginx/conf.d/active_upstream.conf
        if ($ProxyConfig -match "green") {
            $CurrentColor = "green"
        }
    }
} catch {
    Write-Host "⚠️ Impossible de lire la config du proxy (premier déploiement ?). Défaut: Blue."
}

if ($CurrentColor -eq "blue") { $TargetColor = "green" } else { $TargetColor = "blue" }

Write-Host "--- DEPLOYMENT START ---"
Write-Host "🔍 Current Active Color found in Proxy: $CurrentColor"
Write-Host "🎯 Target Color for deployment: $TargetColor"

# ==============================================================================
# 2. PRÉPARATION DES IMAGES
# ==============================================================================
Write-Host "⬇️ Pulling images..."
docker pull "$DockerUser/cloudnative-backend:$GitSha"
docker pull "$DockerUser/cloudnative-frontend:$GitSha"

docker tag "$DockerUser/cloudnative-backend:$GitSha" "cloudnative-backend:$TargetColor"
docker tag "$DockerUser/cloudnative-frontend:$GitSha" "cloudnative-frontend:$TargetColor"

# ==============================================================================
# 3. PRÉPARATION CONFIG NGINX (Fichier temporaire)
# ==============================================================================
# On prépare le contenu, mais on ne l'applique pas tout de suite
# Utilisation des accolades ${TargetColor} pour éviter les erreurs de syntaxe
$NginxConfigContent = "set `$active_backend `"app-front-${TargetColor}:80`";"
$NginxConfigFile = "./nginx/conf.d/active_upstream.conf"

# Assurer que le dossier local existe (pour le volume)
$ParentDir = Split-Path -Parent $NginxConfigFile
if (-not (Test-Path $ParentDir)) { New-Item -ItemType Directory -Force -Path $ParentDir | Out-Null }

# Si le fichier n'existe pas du tout (premier clone), on le crée pour que le volume Docker fonctionne
if (-not (Test-Path $NginxConfigFile)) {
    $NginxConfigContent | Out-File -FilePath $NginxConfigFile -Encoding ascii
}

# ==============================================================================
# 4. DÉMARRAGE DE LA NOUVELLE INFRASTRUCTURE
# ==============================================================================
Write-Host "🚀 Starting $TargetColor stack (and keeping $CurrentColor up)..."

if (-not (docker network ls -q -f name=bluegreen-net)) { docker network create bluegreen-net }

# [IMPORTANT] On inclut TOUS les fichiers compose pour que Docker ne tue pas l'ancienne couleur
$ComposeFiles = @("-f", "docker-compose.base.yml", "-f", "docker-compose.$TargetColor.yml")

# On ajoute l'ancienne couleur si le fichier existe, pour éviter les "orphans"
if (Test-Path "docker-compose.$CurrentColor.yml") {
    $ComposeFiles += "-f"
    $ComposeFiles += "docker-compose.$CurrentColor.yml"
}

# Commande équivalente à : docker-compose -f base -f green -f blue up -d
& docker-compose $ComposeFiles up -d

# ==============================================================================
# 5. HEALTHCHECK (ZERO DOWNTIME)
# ==============================================================================
Write-Host "🏥 Testing health of $TargetColor before switching..."

$MaxRetries = 12
$Retry = 0
$IsHealthy = $false

while ($Retry -lt $MaxRetries) {
    Start-Sleep -Seconds 5
    
    # Le proxy teste la connexion interne vers le nouveau container
    docker exec reverse-proxy wget --spider -q "http://app-front-${TargetColor}:80"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Healthcheck OK: $TargetColor is responding!"
        $IsHealthy = $true
        break
    } else {
        Write-Host "⏳ Waiting for $TargetColor... ($Retry/$MaxRetries)"
    }
    $Retry++
}

if (-not $IsHealthy) {
    Write-Error "❌ CRITICAL: $TargetColor failed to start. Aborting deployment."
    Write-Host "🛑 Stopping broken $TargetColor containers..."
    docker-compose -f "docker-compose.$TargetColor.yml" stop
    exit 1
}

# ==============================================================================
# 6. BASCULE DU TRAFIC (SWITCH)
# ==============================================================================
Write-Host "🔀 Switching Nginx traffic to $TargetColor..."

# 1. On met à jour le fichier sur le disque (pour la persistance si restart)
$NginxConfigContent | Out-File -FilePath $NginxConfigFile -Encoding ascii

# 2. On demande au proxy de recharger sa config
docker exec reverse-proxy nginx -s reload

Write-Host "--- DEPLOYMENT SUCCESS ($CurrentColor kept as backup) ---"
exit 0