# Deploying to DigitalOcean Droplet (Docker)

These steps will help you update your live site with the new Firebase Authentication.

## Prerequisites
- You have pushed your code changes to GitHub.
- You have the **Firebase Keys** ready (from your local `.env.local`).

## Step 1: Push Code to GitHub
Ensure all your recent changes are committed and pushed.
```powershell
git add .
git commit -m "feat: migrate to firebase auth"
git push origin main
```
*Wait for your GitHub Action (if you have one) to build the new Docker image.*

## Step 2: SSH into your Droplet
Open your terminal and connect to your server:
```powershell
ssh root@your_droplet_ip
# or
ssh root@superhomes.my
```

## Step 3: Update Environment Variables
1.  Navigate to your app directory (usually `~/superhomes` or wherever `docker-compose.prod.yml` is).
    ```bash
    cd /path/to/app
    ```
2.  Edit your `.env.local` file:
    ```bash
    nano .env.local
    ```
3.  **Delete** the old Twilio keys (`TWILIO_ACCOUNT_SID`, etc.).
4.  **Add** the new Firebase keys. You can just copy paste the block from your local file:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY="..."
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
    ...
    FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
    ```
    *Tip: Make sure `FIREBASE_SERVICE_ACCOUNT_KEY` is on a single line.*
5.  Save and Exit: `Ctrl+O`, `Enter`, `Ctrl+X`.

## Step 4: Redeploy
Run these commands to pull the new image and restart the container:

```bash
# 1. Pull the latest image
docker-compose -f docker-compose.prod.yml pull

# 2. Restart the app (recreates container with new env vars)
docker-compose -f docker-compose.prod.yml up -d

# 3. Prune old images (optional, clears space)
docker system prune -f
```

## Step 5: Verify
Check the logs to make sure everything started correctly:
```bash
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```
If you see "Ready in ...", you can try the **Register** page on your live site!
