# Superhomes

Superhomes is a modern real estate platform designed to simplify property management, listing, and discovery. It features a comprehensive dashboard for agents and a user-friendly interface for property seekers.

## Features

-   **Interactive Map Search**: Browse properties on an interactive map using Leaflet.
-   **Property Management**: Dashboard for agents to list and manage properties.
-   **Authentication**: Secure user authentication via Supabase.
-   **Comparison Tool**: Compare multiple properties side-by-side.
-   **Favorites**: Save properties to a wishlist.
-   **AI Features**: Integrated AI for property descriptions and amenities.
-   **Watermark Removal**: Specialized service for removing watermarks from property images.

## Tech Stack

-   **Frontend**: [Next.js 15](https://nextjs.org/), [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Database & Auth**: [Supabase](https://supabase.com/)
-   **Maps**: [Leaflet](https://leafletjs.com/), [React Leaflet](https://react-leaflet.js.org/)
-   **Containerization**: [Docker](https://www.docker.com/)

## Prerequisites

Before executing the project, ensure you have the following installed:

-   [Node.js](https://nodejs.org/) (v18 or higher recommended)
-   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (optional, for running the full stack with services)

## Getting Started

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

   Create a `.env.local` file in the root directory. You can use `.env.example` as a template.

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   # ... other variables found in .env.example
   ```

4.  **Run the application**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Docker Setup

To run the application along with the Python-based watermark remover service, refer to the [Combined Setup Guide](COMBINED_SETUP.md).

```bash
docker-compose up -d
```

## Documentation

-   [Combined Setup Guide](COMBINED_SETUP.md)
-   [Docker Guide](DOCKER.md)
