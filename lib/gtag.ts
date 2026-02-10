type GTagEvent = {
    action: string
    category?: string
    label?: string
    value?: number
    [key: string]: any
}

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const sendGAEvent = ({ action, category, label, value, ...rest }: GTagEvent) => {
    if (typeof window !== "undefined" && (window as any).gtag) {
        ; (window as any).gtag("event", action, {
            event_category: category,
            event_label: label,
            value: value,
            ...rest
        })
    }
}

// Specific GA4 events helpers
// https://developers.google.com/analytics/devguides/collection/ga4/reference/events

export const trackPageView = (url: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        ; (window as any).gtag('config', process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID, {
            page_path: url,
        })
    }
}

export const trackSearch = (searchTerm: string) => {
    sendGAEvent({
        action: 'search',
        search_term: searchTerm
    })
}

export const trackShare = (method: string, contentType: string, itemId: string) => {
    sendGAEvent({
        action: 'share',
        method: method,
        content_type: contentType,
        item_id: itemId
    })
}

export const trackLead = (type: 'whatsapp' | 'call' | 'email' | 'form', propertyId?: string) => {
    sendGAEvent({
        action: 'generate_lead',
        category: 'Leads',
        label: `${type} - ${propertyId || 'general'}`,
        currency: 'MYR'
    })
}

// Micro-interaction tracking (Toggle, Hover, Drag)
// Debounce implementation for hovers
let hoverTimer: NodeJS.Timeout
export const trackHover = (elementName: string, category: string = 'UI Interaction') => {
    clearTimeout(hoverTimer)
    hoverTimer = setTimeout(() => {
        sendGAEvent({
            action: 'hover',
            category: category,
            label: elementName
        })
    }, 1000) // Only track if hovered for > 1 second (intent)
}

export const trackToggle = (elementName: string, state: boolean, category: string = 'UI Interaction') => {
    sendGAEvent({
        action: 'toggle',
        category: category,
        label: `${elementName} - ${state ? 'On' : 'Off'}`
    })
}

export const trackDrag = (elementName: string, value?: string, category: string = 'UI Interaction') => {
    sendGAEvent({
        action: 'drag_end',
        category: category,
        label: elementName,
        value: value ? Number(value) : undefined
    })
}
