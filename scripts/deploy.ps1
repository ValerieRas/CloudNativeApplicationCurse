# scripts/deploy.ps1
param (
    [string]$DockerUser,
    [string]$GitSha
)

$ErrorActionPreference = "Stop"

Write-Host "--- Starting Idempotent Deployment for SHA: $GitSha ---"

# 1. Stop containers without removing volumes (Preserves Postgres data)
Write-Host "Stopping current containers..."
docker-compose down

# 2. Pull the specific images from Docker Hub
Write-Host "Pulling latest images..."
docker pull "${DockerUser}/cloudnative-backend:$GitSha"
docker pull "${DockerUser}/cloudnative-frontend:$GitSha"

# 3. Re-tag to 'latest' so docker-compose uses them without modifying the YAML
Write-Host "Updating local tags..."
docker tag "${DockerUser}/cloudnative-backend:$GitSha" gym-backend:latest
docker tag "${DockerUser}/cloudnative-frontend:$GitSha" gym-frontend:latest

# 4. Restart the environment
Write-Host "Restarting containers..."
docker-compose up -d

Write-Host "--- Deployment Successful ---"