param (
    [string]$DockerUser,
    [string]$GitSha
)

# ==============================================================================
# 1. DETERMINER LA COULEUR ACTIVE
# ==============================================================================
$CurrentColor = "blue"

try {
    if (docker ps -q -f "name=reverse-proxy") {
        # On lit la config. Si ca echoue, on reste sur blue.
        $ProxyConfig = docker exec reverse-proxy cat /etc/nginx/conf.d/active_upstream.conf
        if ($ProxyConfig -match "green") {
            $CurrentColor = "green"
        }
    }
} catch {
    Write-Host "WARNING: Cannot read proxy config. Defaulting to Blue."
}

if ($CurrentColor -eq "blue") { $TargetColor = "green" } else { $TargetColor = "blue" }

Write-Host "--- DEPLOYMENT START ---"
Write-Host "Current Color: $CurrentColor"
Write-Host "Target Color : $TargetColor"

# ==============================================================================
# 2. PREPARATION DES IMAGES
# ==============================================================================
Write-Host "Pulling images..."
docker pull "$DockerUser/cloudnative-backend:$GitSha"
docker pull "$DockerUser/cloudnative-frontend:$GitSha"

docker tag "$DockerUser/cloudnative-backend:$GitSha" "cloudnative-backend:$TargetColor"
docker tag "$DockerUser/cloudnative-frontend:$GitSha" "cloudnative-frontend:$TargetColor"

# ==============================================================================
# 3. PREPARATION CONFIG NGINX
# ==============================================================================
# Note: On utilise des backslashes pour Windows et on retire le ./ pour eviter les erreurs de parsing
$NginxConfigContent = "set `$active_backend `"app-front-${TargetColor}:80`";"
$NginxConfigFile = "nginx\conf.d\active_upstream.conf"

$ParentDir = Split-Path -Parent $NginxConfigFile
if (-not (Test-Path $ParentDir)) { New-Item -ItemType Directory -Force -Path $ParentDir | Out-Null }

if (-not (Test-Path $NginxConfigFile)) {
    $NginxConfigContent | Out-File -FilePath $NginxConfigFile -Encoding ascii
}

# ==============================================================================
# 4. DEMARRAGE DE LA NOUVELLE INFRASTRUCTURE
# ==============================================================================
Write-Host "Starting $TargetColor stack..."

if (-not (docker network ls -q -f name=bluegreen-net)) { docker network create bluegreen-net }

# On construit la liste des arguments proprement pour eviter les erreurs d'interpretation
$ComposeFiles = @("-f", "docker-compose.base.yml", "-f", "docker-compose.$TargetColor.yml")

if (Test-Path "docker-compose.$CurrentColor.yml") {
    $ComposeFiles += "-f"
    $ComposeFiles += "docker-compose.$CurrentColor.yml"
}

# Lancement
& docker-compose $ComposeFiles up -d

# ==============================================================================
# 5. HEALTHCHECK
# ==============================================================================
Write-Host "Testing health of $TargetColor before switching..."

$MaxRetries = 12
$Retry = 0
$IsHealthy = $false

while ($Retry -lt $MaxRetries) {
    Start-Sleep -Seconds 5
    
    docker exec reverse-proxy wget --spider -q "http://app-front-${TargetColor}:80"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Healthcheck OK: $TargetColor is responding!"
        $IsHealthy = $true
        break
    } else {
        Write-Host "Waiting for $TargetColor... ($Retry/$MaxRetries)"
    }
    $Retry++
}

if (-not $IsHealthy) {
    Write-Error "CRITICAL: $TargetColor failed to start. Aborting deployment."
    Write-Host "Stopping broken $TargetColor containers..."
    docker-compose -f "docker-compose.$TargetColor.yml" stop
    exit 1
}

# ==============================================================================
# 6. BASCULE DU TRAFIC
# ==============================================================================
Write-Host "Switching Nginx traffic to $TargetColor..."

$NginxConfigContent | Out-File -FilePath $NginxConfigFile -Encoding ascii

docker exec reverse-proxy nginx -s reload

Write-Host "--- DEPLOYMENT SUCCESS ($CurrentColor kept as backup) ---"
exit 0