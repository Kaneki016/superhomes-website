import type { Metadata } from 'next'
import './globals.css'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { CompareProvider } from '@/contexts/CompareContext'
import CompareBar from '@/components/CompareBar'
import GoogleAnalytics from '@/components/GoogleAnalytics'

export const metadata: Metadata = {
    title: {
        default: 'SuperHomes - Your Premium Property Marketplace in Malaysia',
        template: '%s | SuperHomes'
    },
    description: 'Find your dream property with SuperHomes. Browse thousands of properties for sale and rent in Malaysia including condos, landed properties, apartments, and commercial spaces across Kuala Lumpur, Selangor, Johor, Penang and more.',
    keywords: ['property Malaysia', 'real estate Malaysia', 'homes for sale', 'condos Malaysia', 'landed property', 'apartments for rent', 'Kuala Lumpur property', 'Selangor property', 'property agents Malaysia', 'new property projects'],
    authors: [{ name: 'SuperHomes' }],
    creator: 'SuperHomes',
    publisher: 'SuperHomes',
    metadataBase: new URL('https://superhomes.com.my'), // Update with actual production URL
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'SuperHomes - Your Premium Property Marketplace in Malaysia',
        description: 'Find your dream property with SuperHomes. Browse thousands of properties for sale and rent across Malaysia.',
        url: 'https://superhomes.com.my',
        siteName: 'SuperHomes',
        locale: 'en_MY',
        type: 'website',
        images: [
            {
                url: '/logo-icon.svg', // Consider creating a proper OG image (1200x630px)
                width: 1200,
                height: 630,
                alt: 'SuperHomes - Premium Property Marketplace',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'SuperHomes - Your Premium Property Marketplace in Malaysia',
        description: 'Find your dream property with SuperHomes. Browse thousands of properties for sale and rent across Malaysia.',
        images: ['/logo-icon.svg'], // Consider creating a proper Twitter card image
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    icons: {
        icon: '/logo-icon.svg',
        shortcut: '/logo-icon.svg',
        apple: '/logo-icon.svg',
    },
    verification: {
        google: 'YOUR-GSC-VERIFICATION-CODE-HERE', // TODO: Replace with your actual code
        // yandex: 'your-yandex-verification-code',
        // bing: 'your-bing-verification-code',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
                {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID ? (
                    <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
                ) : null}
                <AuthProvider>
                    <FavoritesProvider>
                        <CompareProvider>
                            {children}
                            <CompareBar />
                        </CompareProvider>
                    </FavoritesProvider>
                </AuthProvider>
            </body>
        </html>
    )
}

