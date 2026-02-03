# Superhomes

Superhomes is a cutting-edge real estate platform built to revolutionize property discovery and management in Malaysia. It combines interactive mapping, historical transaction data, and AI-powered insights to provide a comprehensive experience for agents, buyers, and renters.

## Features

### 🗺️ Interactive Property Mapping
- **Smart Search**: Browse properties with an advanced Leaflet-based map interface.
- **Transaction Analytics**: Visualize historical property transaction data on a dedicated map to make informed market decisions.
- **Geocoding**: Automatic coordinate mapping for properties using Google Maps and other services.

### 🏘️ Property Modules
- **New Projects**: Dedicated section for showcasing upcoming real estate developments.
- **Rent & Sell**: Streamlined listing flows for rental and sub-sale properties.
- **Comparison Tool**: Compare multiple properties side-by-side to find the best fit.
- **Favorites & Wishlist**: Save interesting properties for later review.

### 🤖 AI & Data Intelligence
- **AI-Powered Amenities**: Automatically populate nearby amenities using Google Gemini AI.
- **Watermark Removal**: Integrated service to clean property images.
- **Data Enrichment**: Extensive scripts for database population, coordinate verification, and amenity caching.

### 👥 User & Agent Portals
- **Agent Dashboard**: Comprehensive tools for agents to manage listings and leads.
- **Authentication**: Secure login and registration via Supabase and NextAuth.

## Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (Icons)
- **Maps**: [Leaflet](https://leafletjs.com/), [React Leaflet](https://react-leaflet.js.org/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **AI**: Google Generative AI (Gemini)
- **Containerization**: [Docker](https://www.docker.com/)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Docker](https://www.docker.com/) (Optional, for running support services)

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd Superhomes
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file by copying the example:
    ```bash
    cp .env.example .env.local
    ```
    *Fill in your Supabase credentials, Google Maps API key, and other secrets.*

4.  **Run the application**
    ```bash
    npm run dev
    ```
    Visit [http://localhost:3000](http://localhost:3000) to view the app.

## Data Scripts

The project includes a robust suite of scripts in the `scripts/` directory for data maintenance:

- **Geocoding**: `geocode_properties.ts`, `geocode_transactions.ts`
- **Quality Assurance**: `check_coords.ts`, `check_precision.cjs`
- **Data Population**: `populate_amenities_cache.js`
- **Database Management**: `migrate_auth_tables.ts`, `deploy_auth_schema.js`

To run a script (example):
```bash
npx tsx scripts/check_geocoding_status.ts
```

## Docker Setup

For running backend services or isolation, refer to the guides:
- [Combined Setup Guide](COMBINED_SETUP.md)
- [Docker Guide](DOCKER.md)

Start services:
```bash
docker-compose up -d
```
