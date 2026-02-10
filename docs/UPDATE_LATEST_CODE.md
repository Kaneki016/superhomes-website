# Pull the latest code from the repository
git pull origin master
docker compose -f docker-compose.prod.yml pull

# Restart the app
docker compose --env-file .env.local -f docker-compose.prod.yml up -d