# Build and Deploy SuperHomes to Production
# This script builds the Docker image locally with all environment variables
# and saves it for transfer to production server

Write-Host "Building SuperHomes Docker Image Locally..." -ForegroundColor Cyan

# Load environment variables from .env.local
$envFile = ".env.local"
if (Test-Path $envFile) {
    Write-Host "Loading environment variables from .env.local" -ForegroundColor Green
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
} else {
    Write-Host "ERROR: .env.local file not found!" -ForegroundColor Red
    exit 1
}

# Build Docker image with all NEXT_PUBLIC_ variables as build args
Write-Host "Building Docker image with environment variables..." -ForegroundColor Yellow

$buildArgs = @(
    "--build-arg", "NEXT_PUBLIC_APP_URL=$env:NEXT_PUBLIC_APP_URL",
    "--build-arg", "NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=$env:NEXT_PUBLIC_GOOGLE_ANALYTICS_ID",
    "--build-arg", "NEXT_PUBLIC_DO_SPACE_URL=$env:NEXT_PUBLIC_DO_SPACE_URL",
    "--build-arg", "NEXT_PUBLIC_FIREBASE_API_KEY=$env:NEXT_PUBLIC_FIREBASE_API_KEY",
    "--build-arg", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$env:NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "--build-arg", "NEXT_PUBLIC_FIREBASE_PROJECT_ID=$env:NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "--build-arg", "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$env:NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "--build-arg", "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$env:NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "--build-arg", "NEXT_PUBLIC_FIREBASE_APP_ID=$env:NEXT_PUBLIC_FIREBASE_APP_ID",
    "-t", "superhomes-app:latest",
    "."
)

docker build @buildArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "SUCCESS: Docker image built successfully!" -ForegroundColor Green

# Save Docker image to tar file
Write-Host "Saving Docker image to superhomes-app.tar..." -ForegroundColor Yellow
docker save superhomes-app:latest -o superhomes-app.tar

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to save Docker image!" -ForegroundColor Red
    exit 1
}

Write-Host "SUCCESS: Docker image saved to superhomes-app.tar" -ForegroundColor Green

# Display file size
$fileSize = (Get-Item superhomes-app.tar).Length / 1MB
Write-Host "Image size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan

Write-Host ""
Write-Host "Build complete! Next steps:" -ForegroundColor Green
Write-Host "1. Transfer to server: scp superhomes-app.tar root@superhomes.my:/root/" -ForegroundColor White
Write-Host "2. SSH into server: ssh root@superhomes.my" -ForegroundColor White
Write-Host "3. Load image: docker load -i /root/superhomes-app.tar" -ForegroundColor White
Write-Host "4. Update docker-compose.yml to use image: superhomes-app:latest" -ForegroundColor White
Write-Host "5. Restart: cd superhomes; docker compose down; docker compose up -d" -ForegroundColor White
Write-Host ""
Write-Host "Or run: .\deploy-to-production.ps1 to automate steps 1-5" -ForegroundColor Yellow
