# Docker Setup Guide

This project includes Docker and Docker Compose configuration for easy deployment.

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- A `.env` file with your environment variables (required for build)

## Environment Variables

**Important:** Docker Compose reads `.env` files automatically for build arguments. Create a `.env` file in the root directory with the following variables:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Quick Start

1. **Build and start the container:**
   ```bash
   docker-compose up -d
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Stop the container:**
   ```bash
   docker-compose down
   ```

4. **Rebuild after code changes:**
   ```bash
   docker-compose up -d --build
   ```

## Development Mode

For development, you can override the command:

```bash
docker-compose run --rm -p 3000:3000 app npm run dev
```

Or modify `docker-compose.yml` to add a development service.

## Access the Application

Once running, access the applications at:
- **Superhomes App:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health
- **Watermark Remover API:** http://localhost:8000

## Services Included

The `docker-compose.yml` includes two services:

1. **app** - Superhomes Next.js application (port 3000)
2. **watermark-remover** - Watermark removal service (port 8000)

The app service automatically depends on the watermark-remover service and can access it via `http://watermark-remover:8000` within the Docker network.

## Troubleshooting

### Container won't start
- Check that your `.env` file exists and has all required variables
- View logs: `docker-compose logs app`

### Build fails with "supabaseUrl is required"
- Make sure you have a `.env` file (not just `.env.local`) with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Docker Compose reads `.env` automatically for build arguments
- You can copy `.env.example` to `.env` and fill in your values

### Port already in use
- Change the port mapping in `docker-compose.yml`:
  ```yaml
  ports:
    - "3001:3000"  # Use port 3001 instead
  ```

### Rebuild from scratch
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Running Services Separately

If you want to run only the Superhomes app without the watermark-remover:

```bash
# Run only the app service
docker-compose up app
```

If you want to add the watermark-remover separately (using the override file):

```bash
# This will merge both services
docker-compose -f docker-compose.yml -f docker-compose.watermark.yml up
```

## Combining Multiple Compose Files

To combine your `docker-compose.yml` with additional services or overrides:

```bash
# Combine with override file (create docker-compose.override.yml as needed)
docker-compose -f docker-compose.yml -f docker-compose.override.yml up

# Combine with additional services (e.g., Redis, PostgreSQL)
docker-compose -f docker-compose.yml -f docker-compose.services.yml up
```

**See [DOCKER_COMPOSE_GUIDE.md](./DOCKER_COMPOSE_GUIDE.md) for detailed instructions** on:
- Adding databases, caches, or other services
- Environment-specific configurations
- Merging with other projects' compose files
- Using profiles and extends

## Production Deployment

For production, consider:
- Using environment-specific `.env` files
- Setting up proper secrets management
- Configuring reverse proxy (nginx/traefik)
- Setting up SSL/TLS certificates
- Monitoring and logging solutions
