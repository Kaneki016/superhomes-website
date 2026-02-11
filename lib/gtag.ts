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
        // Standard GA4 event structure
        // Note: custom dimensions like 'event_category' and 'event_label' must be configured in GA4 UI to show up in reports
        // However, for standard debugging, we can also push them as direct parameters
        ; (window as any).gtag("event", action, {
            event_category: category,
            event_label: label,
            value: value,
            // Also send as standard parameters for redundancy/debugging clarity
            category: category,
            label: label,
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
        category: 'Search',
        label: searchTerm,
        search_term: searchTerm // GA4 standard parameter
    })
}

export const trackShare = (method: string, contentType: string, itemId: string) => {
    sendGAEvent({
        action: 'share',
        category: 'Engagement',
        label: `${method}:${itemId}`,
        method: method,
        content_type: contentType,
        item_id: itemId
    })
}

export const trackLead = (type: 'whatsapp' | 'call' | 'email' | 'form', propertyId?: string) => {
    sendGAEvent({
        action: 'generate_lead',
        category: 'Leads',
        label: `lead_${type}:${propertyId || 'general'}`,
        method: type, // Custom parameter for easier filtering
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
            label: elementName,
            interaction_type: 'hover',
            element_name: elementName
        })
    }, 1000) // Only track if hovered for > 1 second (intent)
}

export const trackToggle = (elementName: string, state: boolean, category: string = 'UI Interaction') => {
    const stateStr = state ? 'on' : 'off'
    sendGAEvent({
        action: 'toggle',
        category: category,
        label: `${elementName}:${stateStr}`,
        interaction_type: 'toggle',
        element_name: elementName,
        element_state: stateStr
    })
}

export const trackDrag = (elementName: string, value?: string, category: string = 'UI Interaction') => {
    sendGAEvent({
        action: 'drag_end',
        category: category,
        label: `${elementName}:${value}`,
        interaction_type: 'drag',
        element_name: elementName,
        drag_value: value
    })
}
