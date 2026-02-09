# Build Locally and Deploy to Production

This guide helps you build the Docker image on your local machine (which has more resources) and deploy it to your production server.

## Option 1: Build Locally, Save, and Transfer (Recommended for Small Droplets)

### Step 1: Build Docker Image Locally

```powershell
# Navigate to your project directory
cd e:\Project\superhomes-website

# Build the Docker image with all environment variables
docker build `
  --build-arg NEXT_PUBLIC_APP_URL=https://superhomes.my `
  --build-arg NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-B19J4CVKTP `
  --build-arg NEXT_PUBLIC_DO_SPACE_URL=https://supergroups.sgp1.digitaloceanspaces.com/superhomes/public `
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCXcj6bSFK7NRwbAzkrZgzwFdns35_0nxs `
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=superhomes-website.firebaseapp.com `
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=superhomes-website `
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=superhomes-website.firebasestorage.app `
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1034276355762 `
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID=1:1034276355762:web:82621cdb355d60b5b993ab `
  -t superhomes-app:latest .
```

### Step 2: Save Docker Image to File

```powershell
docker save superhomes-app:latest -o superhomes-app.tar
```

### Step 3: Transfer to Production Server

```powershell
scp superhomes-app.tar root@superhomes.my:/root/
```

### Step 4: Load and Run on Production Server

```bash
# SSH into production
ssh root@superhomes.my

# Load the Docker image
docker load -i /root/superhomes-app.tar

# Navigate to your app directory
cd superhomes

# Stop current containers
docker compose down

# Update docker-compose to use the pre-built image
# Edit docker-compose.yml to comment out the build section
nano docker-compose.yml
```

**In docker-compose.yml, change:**
```yaml
services:
  app:
    # Comment out the build section
    # build:
    #   context: .
    #   dockerfile: Dockerfile
    #   args:
    #     - GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
    
    # Use the pre-built image instead
    image: superhomes-app:latest
    
    # ... rest of the config stays the same
```

**Then start the container:**
```bash
docker compose up -d
```

---

## Option 2: Use GitHub Container Registry (Better for CI/CD)

### Step 1: Build and Push to GitHub Container Registry

```powershell
# Login to GitHub Container Registry
$env:CR_PAT = "YOUR_GITHUB_PERSONAL_ACCESS_TOKEN"
echo $env:CR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Build with your GitHub username
docker build `
  --build-arg NEXT_PUBLIC_APP_URL=https://superhomes.my `
  --build-arg NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-B19J4CVKTP `
  --build-arg NEXT_PUBLIC_DO_SPACE_URL=https://supergroups.sgp1.digitaloceanspaces.com/superhomes/public `
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCXcj6bSFK7NRwbAzkrZgzwFdns35_0nxs `
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=superhomes-website.firebaseapp.com `
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID=superhomes-website `
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=superhomes-website.firebasestorage.app `
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1034276355762 `
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID=1:1034276355762:web:82621cdb355d60b5b993ab `
  -t ghcr.io/YOUR_GITHUB_USERNAME/superhomes-website:latest .

# Push to registry
docker push ghcr.io/YOUR_GITHUB_USERNAME/superhomes-website:latest
```

### Step 2: Pull and Run on Production

```bash
# SSH into production
ssh root@superhomes.my

# Login to GitHub Container Registry
export CR_PAT=YOUR_GITHUB_PERSONAL_ACCESS_TOKEN
echo $CR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Pull the image
docker pull ghcr.io/YOUR_GITHUB_USERNAME/superhomes-website:latest

# Update docker-compose.yml to use the registry image
cd superhomes
nano docker-compose.yml
```

**Update docker-compose.yml:**
```yaml
services:
  app:
    image: ghcr.io/YOUR_GITHUB_USERNAME/superhomes-website:latest
    # Comment out build section
```

**Start containers:**
```bash
docker compose down
docker compose up -d
```

---

## Option 3: Simple Build Script (Easiest)

I'll create a PowerShell script that does everything for you automatically.

---

## Verification

After deployment, verify Google Analytics is working:

```bash
# Check if GA script is present
curl -s https://superhomes.my | grep "G-B19J4CVKTP"

# You should see output like:
# <script async src="https://www.googletagmanager.com/gtag/js?id=G-B19J4CVKTP"></script>
# gtag('config', 'G-B19J4CVKTP');
```

---

## Important Notes

- ✅ Building locally avoids memory issues on small droplets
- ✅ The image includes all `NEXT_PUBLIC_*` variables at build time
- ✅ Runtime environment variables (DB credentials, API keys) are still loaded from `.env.local` on the server
- ⚠️ The `.tar` file will be large (~500MB-1GB), transfer may take time
- 💡 GitHub Container Registry option is better for frequent deployments
