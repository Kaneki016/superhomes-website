/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone', // Enable standalone output for Docker
    images: {
        domains: ['localhost', 'my1-cdn.pgimgs.com', 'sg1-cdn.pgimgs.com', 'sg2-cdn.pgimgs.com'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
            {
                protocol: 'https',
                hostname: '**.pgimgs.com',
            },
            {
                protocol: 'https',
                hostname: 'my1-cdn.pgimgs.com',
            },
            {
                protocol: 'https',
                hostname: 'sg1-cdn.pgimgs.com',
            },
        ],
        // Use unoptimized for external images on Netlify (no built-in image optimization)
        unoptimized: true,
    },
}

module.exports = nextConfig
