# Combined Docker Compose Setup

This document explains how the Superhomes app and Watermark Remover services are combined.

## Overview

The `docker-compose.yml` file now includes both services:

1. **superhomes-app** - Your Next.js application (port 3000)
2. **watermark-remover** - Python-based watermark removal service (port 8000)

## Directory Structure

Make sure your directory structure looks like this:

```
E:\Work\
├── Superhomes\              # Your Next.js app
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── ...
└── superhomes-watermark-remover\  # Watermark remover service
    ├── Dockerfile
    ├── requirements.txt
    ├── api.py
    ├── input\               # Input images directory
    └── output\              # Output images directory
```

## Quick Start

1. **Start both services:**
   ```bash
   cd E:\Work\Superhomes
   docker-compose up -d
   ```

2. **View logs:**
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f app
   docker-compose logs -f watermark-remover
   ```

3. **Stop services:**
   ```bash
   docker-compose down
   ```

## Service Communication

The services communicate through Docker's internal network:

- **From app to watermark-remover:** Use `http://watermark-remover:8000`
- **From host machine:** Use `http://localhost:8000`

The app service has an environment variable `WATERMARK_REMOVER_URL` set to `http://watermark-remover:8000` for internal communication.

## Using the Watermark Remover in Your App

To use the watermark remover service from your Next.js app, you can make API calls:

```typescript
// In your Next.js API route or server component
const watermarkRemoverUrl = process.env.WATERMARK_REMOVER_URL || 'http://watermark-remover:8000';

// Example API call
const response = await fetch(`${watermarkRemoverUrl}/remove`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageUrl: '...' })
});
```

## Volumes

The watermark-remover service uses the following volumes:

- `../superhomes-watermark-remover/input` - Input images directory
- `../superhomes-watermark-remover/output` - Output images directory
- `hf_cache` - Hugging Face model cache (persisted)
- `torch_cache` - PyTorch cache (persisted)

## Running Services Separately

### Run only the app:
```bash
docker-compose up app
```

### Run only the watermark-remover:
```bash
docker-compose up watermark-remover
```

### Use the override file (if you want to add it separately):
```bash
docker-compose -f docker-compose.yml -f docker-compose.watermark.yml up
```

## GPU Support

To enable GPU support for the watermark-remover (requires NVIDIA Container Toolkit):

1. Uncomment the `deploy` section in `docker-compose.yml` under the `watermark-remover` service
2. Install NVIDIA Container Toolkit on your system
3. Restart Docker

## Troubleshooting

### Watermark remover can't find input/output directories
- Make sure the directories exist:
  ```bash
  mkdir -p ../superhomes-watermark-remover/input
  mkdir -p ../superhomes-watermark-remover/output
  ```

### Port conflicts
- If port 8000 is already in use, change it in `docker-compose.yml`:
  ```yaml
  ports:
    - "8001:8000"  # Use port 8001 instead
  ```

### App can't connect to watermark-remover
- Check both services are on the same network: `docker network ls`
- Verify the service name matches: `watermark-remover`
- Check logs: `docker-compose logs watermark-remover`

### Rebuild services
```bash
# Rebuild both
docker-compose build --no-cache

# Rebuild specific service
docker-compose build --no-cache watermark-remover
docker-compose build --no-cache app
```

## Environment Variables

### Superhomes App (.env.local)
```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Watermark remover URL (optional, defaults to http://watermark-remover:8000)
WATERMARK_REMOVER_URL=http://watermark-remover:8000
```

### Watermark Remover (../superhomes-watermark-remover/.env)
Create a `.env` file in the `superhomes-watermark-remover` directory:

```env
# Supabase configuration for watermark remover
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```
