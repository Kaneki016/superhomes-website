'use client'

import Script from 'next/script'

export default function GoogleAnalytics({ gaId }: { gaId: string }) {
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

          window.gtag('config', '${gaId}');
        `}
            </Script>
        </>
    )
}
