'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function GoogleAnalytics({ gaId }: { gaId: string }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const isMounted = useRef(false)

    useEffect(() => {
        // Skip the first run as the script tag handles the initial page view
        if (!isMounted.current) {
            isMounted.current = true
            return
        }

        if (typeof window !== 'undefined' && (window as any).gtag) {
            const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
                ; (window as any).gtag('config', gaId, {
                    page_path: url,
                })
        }
    }, [pathname, searchParams, gaId])

    if (!gaId) return null

    return (
        <>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = function(){window.dataLayer.push(arguments);};
          window.gtag('js', new Date());

          window.gtag('config', '${gaId}', {
            page_path: window.location.pathname,
            debug_mode: ${process.env.NODE_ENV === 'development' ? 'true' : 'false'} 
          });
        `}
            </Script>
        </>
    )
}
