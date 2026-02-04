# Pull the latest code from the repository
git pull origin main
docker compose -f docker-compose.prod.yml pull

# Restart the app
docker compose -f docker-compose.prod.yml up -d