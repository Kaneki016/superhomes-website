# Agent Claiming Guide

This feature allows real estate agents to "claim" their scraped profiles on Superhomes, linking their Supabase Auth account to their public Agent Profile.

## 1. Prerequisites (Configuration)
Before this works, ensure Supabase is configured:
1.  **Enable Phone Auth**: Supabase Dashboard > Authentication > Providers > Phone > Enable.
2.  **SMS/WhatsApp Provider**: Configure Twilio (see `WHATSAPP_AUTH_SETUP.md`) or use **Test Phone Numbers** (see below).

## 2. How to Test (Development Mode)
Since we are using scraped data, your real phone number likely *does not* match any agent profile in the database. You must "seed" the database for testing.

### Step 1: Set up a Test User
1.  Go to **Supabase Dashboard** > **Authentication** > **Providers** > **Phone**.
2.  Scroll to **Phone Numbers** (Test Users).
3.  Add a test number:
    -   **Phone**: `+60123456789` (or your preferred fake number)
    -   **Password/OTP**: `123456`

### Step 2: Prepare a Target Agent Profile
You need an agent profile that matches this phone number.
1.  Go to **Supabase Dashboard** > **Table Editor** > `contacts`.
2.  Find any random agent row (where `contact_type` is 'agent').
3.  Edit that row:
    -   Change `phone` to `+60123456789` (Must match your test user exactly).
    -   Make sure `auth_id` is `NULL` (Empty).
    -   Note down the `id` or `name` of this agent so you can find them in the app.

### Step 3: Run the Test
1.  Start the app: `npm run dev`.
2.  **Do NOT log in yet.**
3.  Navigate to the Agent's Profile page:
    -   Go to `/agents` (if you have a list) or find a property listed by that agent.
    -   Click on the Agent's name/photo to view their profile.
4.  Click the **"Claim Profile"** button.
    -   *Note: If you are already logged in as a normal user, you might need to sign out first, or the system might auto-link if the phone matches (depending on implementation).*
5.  **Enter Phone Number**: Input `+60123456789`.
6.  **Verify**:
    -   Click "Verify & Send OTP".
    -   Wait for the OTP field.
7.  **Enter OTP**: Input `123456`.
8.  **Success**: You should see "Account Claimed!".

### Step 4: Verify the Link
1.  Go back to **Supabase Dashboard** > **Table Editor** > `contacts`.
2.  Check the row you edited.
3.  The `auth_id` column should now be populated with a UUID (the User ID from the `auth.users` table).

## 3. Common Issues
-   **"Phone number mismatch"**: The phone number you entered to login does not match the `phone` column in the `contacts` table. Formats must match (e.g., both use `+60...` or just `60...`). Our code tries to normalize this, but exact match is safest for testing.
-   **"Agent profile not found"**: Ensure you are on the correct agent page.
-   **"Profile already claimed"**: The `auth_id` column is not null. Clear it in the database to test again.
-   **500 Error**: Check the server console. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local` because the backend uses it to write to the `contacts` table (bypassing potential RLS for unowned profiles).
