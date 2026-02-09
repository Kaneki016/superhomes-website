# Deploy SuperHomes to Production Server
# This script transfers the Docker image and deploys it to production

param(
    [string]$ServerHost = "superhomes.my",
    [string]$ServerUser = "root"
)

$imageTar = "superhomes-app.tar"

Write-Host "Deploying SuperHomes to Production..." -ForegroundColor Cyan

# Check if image tar exists
if (-not (Test-Path $imageTar)) {
    Write-Host "ERROR: $imageTar not found! Run .\build-local.ps1 first" -ForegroundColor Red
    exit 1
}

# Transfer image to server
Write-Host "Transferring Docker image to server..." -ForegroundColor Yellow
scp $imageTar "${ServerUser}@${ServerHost}:/root/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to transfer image!" -ForegroundColor Red
    exit 1
}

Write-Host "SUCCESS: Image transferred successfully!" -ForegroundColor Green

# Deploy on server
Write-Host "Deploying on production server..." -ForegroundColor Yellow

$deployScript = @"
# Load Docker image
echo 'Loading Docker image...'
docker load -i /root/$imageTar

# Navigate to app directory
cd /root/superhomes || cd /root/Superhomes || cd ~/superhomes

# Backup current docker-compose.yml
cp docker-compose.yml docker-compose.yml.backup

# Update docker-compose.yml to use pre-built image
echo 'Updating docker-compose.yml...'
sed -i 's/^    build:/    # build:/' docker-compose.yml
sed -i 's/^      context:/      # context:/' docker-compose.yml
sed -i 's/^      dockerfile:/      # dockerfile:/' docker-compose.yml
sed -i 's/^      args:/      # args:/' docker-compose.yml
sed -i 's/^        - GOOGLE_MAPS_API_KEY/        # - GOOGLE_MAPS_API_KEY/' docker-compose.yml

# Add image line if not exists
if ! grep -q 'image: superhomes-app:latest' docker-compose.yml; then
    sed -i '/app:/a\    image: superhomes-app:latest' docker-compose.yml
fi

# Stop and restart containers
echo 'Restarting containers...'
docker compose down
docker compose up -d

# Wait for container to start
echo 'Waiting for container to start...'
sleep 10

# Verify deployment
echo 'Verifying deployment...'
curl -s https://superhomes.my | grep -q 'G-B19J4CVKTP' && echo 'SUCCESS: Google Analytics detected!' || echo 'WARNING: Google Analytics not found'

echo 'Deployment complete!'
"@

ssh "${ServerUser}@${ServerHost}" $deployScript

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Deployment successful!" -ForegroundColor Green
Write-Host "Visit https://superhomes.my to verify" -ForegroundColor Cyan
Write-Host "Check Google Analytics Real-Time reports" -ForegroundColor Cyan
