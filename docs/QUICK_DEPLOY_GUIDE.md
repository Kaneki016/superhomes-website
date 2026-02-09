# Quick Deployment Guide for SuperHomes

Follow these steps to deploy the latest code changes to production and ensure Google Analytics is working.

## Step 1: SSH into Production Server

```bash
ssh root@superhomes.my
cd superhomes
```

## Step 2: Pull Latest Code (if using Git)

```bash
git pull origin main
```

Or if you need to copy files from local:
```powershell
# From your local machine (Windows PowerShell)
scp -r e:\Project\superhomes-website\* root@superhomes.my:/root/superhomes/
```

## Step 3: Verify Environment Variables

Check if `.env.local` exists and contains the Google Analytics ID:

```bash
cat .env.local | grep NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
```

**Expected output:**
```
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-B19J4CVKTP
```

If missing, add it:
```bash
nano .env.local
# Add: NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-B19J4CVKTP
# Save: Ctrl+O, Enter, Ctrl+X
```

## Step 4: Rebuild and Restart

```bash
docker compose down
docker compose up -d --build
```

## Step 5: Verify Deployment

### Check if site is running:
```bash
curl -I https://superhomes.my
```

### Check Docker logs:
```bash
docker compose logs -f app
```

### Verify Google Analytics in browser:
1. Visit https://superhomes.my
2. Press `Ctrl+U` (or `Cmd+U` on Mac) to view page source
3. Search for `G-B19J4CVKTP` - it should appear in the gtag script

## Step 6: Test Google Analytics

1. Open Google Analytics dashboard
2. Go to **Reports → Realtime**
3. Visit your website and navigate a few pages
4. You should see active users appear in real-time (within 1-2 minutes)

---

## Troubleshooting

**If Google Analytics script is not in page source:**
- The environment variable was not available during build
- Verify `.env.local` exists in the same directory as `docker-compose.yml`
- Rebuild: `docker compose down && docker compose up -d --build`

**If site doesn't load:**
- Check Docker logs: `docker compose logs app`
- Verify port 80 is mapped correctly in `docker-compose.yml`
- Check firewall settings

For detailed troubleshooting, see [PRODUCTION_ENV_CHECKLIST.md](./PRODUCTION_ENV_CHECKLIST.md)
