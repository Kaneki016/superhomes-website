# Docker Compose - Combining Multiple Files Guide

This guide explains different methods to combine your Docker Compose file with other compose files.

## Method 1: Multiple Compose Files (Recommended)

Docker Compose automatically merges multiple files when you specify them with `-f` flag. Files are merged in order (later files override earlier ones).

### Basic Usage

```bash
# Combine base + override file
docker-compose -f docker-compose.yml -f docker-compose.override.yml up

# Combine base + production override (create docker-compose.prod.yml as needed)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up

# Combine base + custom services
docker-compose -f docker-compose.yml -f docker-compose.services.yml up
```

### Example: Adding Redis

Create `docker-compose.services.yml`:
```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

Then run:
```bash
docker-compose -f docker-compose.yml -f docker-compose.services.yml up -d
```

## Method 2: Using docker-compose.override.yml (Automatic)

Docker Compose automatically looks for `docker-compose.override.yml` in the same directory. If it exists, it's automatically merged with `docker-compose.yml`.

```bash
# This automatically uses both files
docker-compose up
```

**Note:** This file is typically gitignored for local overrides.

## Method 3: Merging Services Directly

You can merge services by adding them to your existing `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    # ... your existing app config

  # Add new services here
  redis:
    image: redis:7-alpine
    container_name: superhomes-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

## Method 4: Using Profiles

Use profiles to conditionally include services:

```yaml
version: '3.8'

services:
  app:
    # ... your existing config

  redis:
    image: redis:7-alpine
    profiles: ["cache", "full-stack"]
    # ... redis config

  postgres:
    image: postgres:15-alpine
    profiles: ["database", "full-stack"]
    # ... postgres config
```

Then run with specific profiles:
```bash
# Run app only
docker-compose up

# Run app + redis
docker-compose --profile cache up

# Run all services
docker-compose --profile full-stack up
```

## Method 5: Extending from Base File

Create a base file and extend it (note: `extends` is deprecated but still works):

```yaml
# docker-compose.base.yml
version: '3.8'

services:
  app:
    build: .
    # ... common config
```

```yaml
# docker-compose.dev.yml (create this file as needed)
version: '3.8'

services:
  app:
    extends:
      file: docker-compose.base.yml
      service: app
    volumes:
      - .:/app  # Add dev-specific volumes
```

## Common Scenarios

### Scenario 1: Add Database Service

```yaml
# docker-compose.db.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-superhomes}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  app:
    depends_on:
      - postgres
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/superhomes

volumes:
  postgres-data:
```

### Scenario 2: Add Redis Cache

```yaml
# docker-compose.cache.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

  app:
    depends_on:
      - redis
    environment:
      - REDIS_URL=redis://redis:6379

volumes:
  redis-data:
```

### Scenario 3: Add Nginx Reverse Proxy

```yaml
# docker-compose.nginx.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app

  app:
    # Remove port mapping (nginx handles it)
    expose:
      - "3000"
```

### Scenario 4: Combine with Another Project

If you have another project's compose file:

```bash
# Run both projects together
docker-compose -f docker-compose.yml -f ../other-project/docker-compose.yml up
```

Or create a combined file:
```yaml
# docker-compose.full.yml
version: '3.8'

services:
  # Your app
  superhomes-app:
    build: .
    # ... config

  # Other project's service
  other-service:
    build: ../other-project
    # ... config
```

## Best Practices

1. **Keep base file simple**: Put common config in `docker-compose.yml`
2. **Use override files**: Create environment-specific overrides
3. **Use .gitignore**: Add `docker-compose.override.yml` to `.gitignore` for local overrides
4. **Document dependencies**: Use `depends_on` to ensure proper startup order
5. **Use networks**: Create custom networks for service isolation

## Example: Complete Setup

```bash
# Development (create docker-compose.dev.yml as needed)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production (create docker-compose.prod.yml as needed)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up

# With additional services
docker-compose -f docker-compose.yml -f docker-compose.services.yml up

# Full stack (app + db + cache + nginx)
docker-compose -f docker-compose.yml \
               -f docker-compose.db.yml \
               -f docker-compose.cache.yml \
               -f docker-compose.nginx.yml \
               up -d
```

## Troubleshooting

### Services not connecting
- Check service names match in `depends_on`
- Verify networks are shared (default network is usually fine)
- Check environment variables are set correctly

### Port conflicts
- Change port mappings in override files
- Use `expose` instead of `ports` for internal communication

### Volume conflicts
- Use named volumes instead of bind mounts when possible
- Check volume names don't conflict
