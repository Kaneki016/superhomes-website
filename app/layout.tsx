import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import ScrollToTop from '@/components/ScrollToTop'

export const metadata: Metadata = {
    title: 'SuperHomes - Your Premium Property Marketplace',
    description: 'Find your dream property with SuperHomes. Browse thousands of properties for sale including condos, landed properties, and commercial spaces.',
    keywords: 'property, real estate, homes for sale, condos, landed property, Malaysia property',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <AuthProvider>
                    <FavoritesProvider>
                        {children}
                        <ScrollToTop />
                    </FavoritesProvider>
                </AuthProvider>
            </body>
        </html>
    )
}
