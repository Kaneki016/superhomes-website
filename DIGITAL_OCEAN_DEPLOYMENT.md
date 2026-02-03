# Deploying to DigitalOcean Droplet

This guide defines the steps to deploy the Superhomes application to a DigitalOcean Droplet.

## 1. Create and Prepare the Droplet

1.  **Create a Droplet**:
    *   **Image**: Ubuntu 24.04 (LTS) x64 (recommended)
    *   **Size**: Basic (Generic) - at least 1GB RAM (2GB recommended for build processes)
    *   **Region**: Choose one close to your users (e.g., Singapore for `sgp1`)

2.  **Access the Droplet**:
    Open your terminal and SSH into the server:
    ```bash
    ssh root@<DROPLET_IP_ADDRESS>
    ```

3.  **Install Docker and Docker Compose**:
    Run the following commands on the server:
    ```bash
    # Update package list
    apt update

    # Install Docker and Compose
    apt install -y docker.io docker-compose-v2

    # Enable and start Docker
    systemctl enable --now docker
    ```

    **CRITICAL STEP: Add Swap Space**
    Node.js builds are memory intensive. To prevent "SIGKILL" or Out-Of-Memory errors on small droplets (1-2GB RAM), you **MUST** add swap space:

    ```bash
    # Allocate 2GB swap file
    fallocate -l 2G /swapfile

    # Set permissions
    chmod 600 /swapfile

    # Set up swap area
    mkswap /swapfile

    # Enable swap
    swapon /swapfile

    # Make it permanent
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

    # Verify
    free -h
    ```
    *You should see 'Swap' with 2.0Gi value.*

## 2. Deploy the Code

You have two main options to get your code onto the server.

### Option A: Git Clone (Recommended)
1.  **Clone the repository**:
    ```bash
    git clone <YOUR_GITHUB_REPO_URL> superhomes
    cd superhomes
    ```

### Option B: Copy Local Files (SCP)
If your code isn't in a remote repo yet, you can copy your local folder:
*   **From your local machine (Windows PowerShell)**:
    ```powershell
    # Make sure you are in the parent directory of your project
    scp -r .\Superhomes root@<DROPLET_IP_ADDRESS>:/root/superhomes
    ```

### Option C: GitHub Actions (CI/CD) - **RECOMMENDED**
*This method avoids building on the server, saving memory and time.*

1.  **Configure GitHub Secrets**:
    Go to your repository Settings > Secrets and variables > Actions. Add the following repository secrets (copy values from your `.env.local`):
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
    *   `SUPABASE_JWT_SECRET`
    *   `GOOGLE_MAPS_API_KEY`
    *   `NEXT_PUBLIC_APP_URL`
    *   `NEXT_PUBLIC_DO_SPACE_URL`

2.  **Push Code**:
    Push your code to the `main` branch. This will trigger the build in GitHub Actions.

3.  **Create Personal Access Token (PAT)**:
    *   Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic).
    *   Generate new token -> Select `read:packages`.
    *   Copy the token.

4.  **Login on Droplet**:
    SSH into your droplet and run:
    ```bash
    export CR_PAT=YOUR_COPIED_TOKEN
    echo $CR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
    ```

5.  **Run with Pre-built Image**:
    Create a `docker-compose.prod.yml` on the droplet (or edit `docker-compose.yml`) to use the image:
    ```yaml
    services:
      app:
        image: ghcr.io/<your-github-username>/<your-repo-name>:latest
        # build: .  <-- COMMENT THIS OUT
    ```

## 3. Configure Environment

1.  **Enter the project directory**:
    ```bash
    cd superhomes
    ```

2.  **Create the environment file**:
    ```bash
    nano .env.local
    ```

3.  **Paste your configuration**:
    Paste the contents of your local `.env.local` file.
    *   *Tip*: Right-click usually pastes in SSH terminals.
    *   **Important**: Ensure `NEXT_PUBLIC_APP_URL` is set to your Droplet's IP or Domain (e.g., `http://<DROPLET_IP>:3000`).

4.  **Save and Exit**:
    *   Press `Ctrl+O`, then `Enter` to save.
    *   Press `Ctrl+X` to exit.

## 4. Build and Run

1.  **Start the application**:
    ```bash
    docker compose up -d --build
    ```

2.  **Check Status**:
    ```bash
    docker compose logs -f
    ```

The application should now be accessible at `http://<DROPLET_IP>:3000`.

## 5. (Optional) Run on Port 80

If you want the app accessible on standard HTTP port 80 instead of 3000:

1.  **Edit `docker-compose.yml`**:
    ```bash
    nano docker-compose.yml
    ```

2.  **Change Port Mapping**:
    Find the `ports` section under `app`:
    ```yaml
    ports:
      - "80:3000"  # Change "3000:3000" to "80:3000"
    ```

3.  **Restart**:
    ```bash
    docker compose up -d
    ```

Now you can access it at `http://<DROPLET_IP>`.
