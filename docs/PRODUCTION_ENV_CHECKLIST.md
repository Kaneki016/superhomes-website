# Production Environment Variables Checklist

This checklist ensures all required environment variables are properly configured on the production server (superhomes.my).

## 🚨 Critical: Google Analytics Setup

For Google Analytics to work, the environment variable **MUST** be set **before building** the Docker image, as `NEXT_PUBLIC_*` variables are embedded at build time.

### Steps to Verify and Fix:

1. **SSH into production server:**
   ```bash
   ssh root@superhomes.my
   cd superhomes  # or your deployment directory
   ```

2. **Check if `.env.local` exists:**
   ```bash
   ls -la .env.local
   ```

3. **Verify Google Analytics ID is set:**
   ```bash
   cat .env.local | grep NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
   ```
   
   **Expected output:**
   ```
   NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-B19J4CVKTP
   ```

4. **If missing, add it to `.env.local`:**
   ```bash
   nano .env.local
   ```
   
   Add this line:
   ```
   NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-B19J4CVKTP
   ```
   
   Save with `Ctrl+O`, `Enter`, then exit with `Ctrl+X`.

5. **Rebuild and restart Docker containers:**
   ```bash
   docker compose down
   docker compose up -d --build
   ```

6. **Verify the build includes GA:**
   ```bash
   docker compose logs app | grep -i "analytics\|gtag"
   ```

## 📋 Complete Environment Variables List

Ensure all these variables are present in production `.env.local`:

### App Configuration
```bash
NEXT_PUBLIC_APP_URL=https://superhomes.my
```

### Google Services
```bash
GOOGLE_MAPS_API_KEY=<your-key>
GOOGLE_GENERATIVE_AI_API_KEY=<your-key>
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-B19J4CVKTP
```

### Database Configuration
```bash
DB_HOST=<your-db-host>
DB_PORT=25060
DB_NAME=superhomes
DB_USER=<your-db-user>
DB_PASSWORD=<your-db-password>
DB_SSL=true
DATABASE_URL=<your-postgresql-connection-string>
```

### Firebase Client Config
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=<your-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-domain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-bucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>
```

### Firebase Admin Config
```bash
FIREBASE_SERVICE_ACCOUNT_KEY=<your-service-account-json>
NEXTAUTH_SECRET=<your-secret>
```

### DigitalOcean Spaces
```bash
NEXT_PUBLIC_DO_SPACE_URL=<your-space-url>
```

## ✅ Verification Steps

After deployment, verify everything is working:

### 1. Check Website Loads
```bash
curl -I https://superhomes.my
```
Expected: `HTTP/2 200`

### 2. Verify Google Analytics Script in HTML
Visit https://superhomes.my and view page source (`Ctrl+U` or `Cmd+U`), then search for:
- `googletagmanager.com/gtag/js?id=G-B19J4CVKTP`
- `gtag('config', 'G-B19J4CVKTP')`

If these are **NOT** present, the environment variable was not available during build.

### 3. Test Real-Time Analytics
1. Visit https://superhomes.my
2. Navigate to a few pages
3. Open Google Analytics → Reports → Realtime
4. You should see active users within 1-2 minutes

### 4. Check Docker Logs
```bash
docker compose logs -f app
```
Look for any errors related to missing environment variables.

## 🔄 Deployment Workflow

**Every time you deploy code changes:**

1. Pull latest code (if using Git):
   ```bash
   git pull origin main
   ```

2. Verify `.env.local` still exists and is correct:
   ```bash
   cat .env.local
   ```

3. Rebuild containers:
   ```bash
   docker compose down
   docker compose up -d --build
   ```

4. Monitor logs for errors:
   ```bash
   docker compose logs -f
   ```

## 🐛 Troubleshooting

### Google Analytics Not Tracking

**Symptom:** GA dashboard shows "No data received"

**Solutions:**
1. Verify `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` is in production `.env.local`
2. Rebuild Docker image (environment variables are embedded at build time)
3. Check browser console for GA errors (F12 → Console)
4. Verify script tags are in page source
5. Wait 24-48 hours for data to appear (Real-Time should work immediately)

### Environment Variables Not Loading

**Symptom:** App crashes or features don't work

**Solutions:**
1. Check `.env.local` exists in the same directory as `docker-compose.yml`
2. Verify file permissions: `chmod 600 .env.local`
3. Ensure no syntax errors in `.env.local` (no spaces around `=`)
4. Restart containers after any `.env.local` changes

## 📝 Notes

- **`.env.local` is gitignored** - You must manually create it on the production server
- **`NEXT_PUBLIC_*` variables** are embedded at **build time**, not runtime
- **Rebuild required** whenever you change `NEXT_PUBLIC_*` variables
- **Security**: Never commit `.env.local` to Git - it contains sensitive credentials
