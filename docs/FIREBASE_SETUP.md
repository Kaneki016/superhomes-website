# Firebase Phone Auth Setup Guide

This guide explains how to get the 2 important pieces of configuration from Firebase:
1.  **Client Config** (for `.env.local` keys starting with `NEXT_PUBLIC_`)
2.  **Service Account Key** (for `.env.local` key `FIREBASE_SERVICE_ACCOUNT_KEY`)

## Step 1: Create Project & Enable Auth
1.  Go to [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"** and give it a name like `SuperHomes-Auth`.
3.  Once created, go to **Build** > **Authentication** (in the left sidebar).
4.  Click **"Get started"**.
5.  Select **"Phone"** from the Sign-in method list.
6.  **Enable** it and click **Save**.

## Step 2: Get Client Keys (for frontend)
1.  Click the **Project Settings** (Gear icon ⚙️) at the top left > **Project settings**.
2.  Scroll down to the "Your apps" section.
3.  Click the **Web** icon (`</>`).
4.  Register the app (Name it "SuperHomes Web").
5.  You will see a code block `const firebaseConfig = { ... }`.
6.  Copy the values into your `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="superhomes-auth.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="superhomes-auth"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="superhomes-auth.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1234..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:1234:web:..."
```

## Step 3: Get Admin Key (for backend)
1.  Still in **Project settings**, click the **Service accounts** tab.
2.  Click **"Generate new private key"**.
3.  Click **"Generate key"** to confirm.
4.  A `.json` file will download to your computer.
5.  Open this file with any text editor (Notepad, VS Code).
6.  Copy the **ENTIRE** content of the file (it starts with `{` and ends with `}`).
7.  Paste it into your `.env.local` as a single line string:

```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account", "project_id": ... }'
```
*Note: Make sure to wrap the entire JSON in single quotes `'` so `.env` handles it correctly.*

## Step 4: Add Test Phone Number (Optional)
To test without using real SMS credits:
1.  Go back to **Authentication** > **Sign-in method** > **Phone**.
2.  Click "Phone numbers for testing".
3.  Add a number (e.g., `+60123456789`) and a verification code (e.g., `123456`).
4.  You can now use this number to login immediately!
