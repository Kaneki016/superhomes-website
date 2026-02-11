# Google Analytics 4 (GA4) Implementation Guide

## Overview
This project uses a custom implementation of Google Analytics 4 (GA4) optimized for Next.js App Router (App Directory). It includes a component for initialization and automatic page view tracking, along with a library of utility functions for tracking specific user interactions.

## Configuration

### Environment Variables
Ensure the following environment variable is set in your `.env.local` or `.env` file:

```env
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

## Architecture

### 1. Initialization Component (`components/GoogleAnalytics.tsx`)
This client component initializes the GA4 script and automatically tracks page views when the route changes.

**Usage:**
It should be placed in the root layout (`app/layout.tsx`) to ensure it runs on every page.

```tsx
// app/layout.tsx
import GoogleAnalytics from '@/components/GoogleAnalytics'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
        {children}
      </body>
    </html>
  )
}
```

**Features:**
- Uses `next/script` for optimal loading strategy (`afterInteractive`).
- Listens to `usePathname` and `useSearchParams` to trigger page view events on client-side navigation.
- Enables `debug_mode` automatically in development environment.

### 2. Utility Library (`lib/gtag.ts`)
Contains helper functions to send structured events to GA4.

## Tracking Functions

### General Event Tracking
The base function `sendGAEvent` sends a custom event.

```typescript
import { sendGAEvent } from '@/lib/gtag'

sendGAEvent({
  action: 'button_click',
  category: 'User Interaction',
  label: 'Sign Up Button',
  value: 1
})
```

### Specific Event Helpers

#### `trackSearch(searchTerm: string)`
Tracks search queries performed by the user.
- **Action**: `search`
- **Category**: `Search`
- **Label**: `<searchTerm>`

#### `trackShare(method: string, contentType: string, itemId: string)`
Tracks when a user shares content.
- **Action**: `share`
- **Category**: `Engagement`
- **Label**: `<method>:<itemId>`
- **Example**: `trackShare('whatsapp', 'property', 'prop-123')`

#### `trackLead(type: 'whatsapp' | 'call' | 'email' | 'form', propertyId?: string)`
Tracks lead generation actions.
- **Action**: `generate_lead`
- **Category**: `Leads`
- **Label**: `lead_<type>:<propertyId>`
- **Example**: `trackLead('whatsapp', 'prop-123')`

#### `trackHover(elementName: string, category?: string)`
Tracks hover interactions (debounced by 1 second to capture intent).
- **Action**: `hover`
- **Example**: `trackHover('property-card-123')`

#### `trackToggle(elementName: string, state: boolean, category?: string)`
Tracks toggle/switch interactions.
- **Action**: `toggle`
- **Example**: `trackToggle('theme-switch', true)`

#### `trackDrag(elementName: string, value?: string, category?: string)`
Tracks drag-and-drop interactions.
- **Action**: `drag_end`
- **Example**: `trackDrag('price-slider', '500-1000')`

## Debugging

To verify that events are being sent correctly:

1.  **Google Analytics DebugView**:
    - Go to your GA4 property -> Admin -> DebugView.
    - Interact with your local application.
    - Events should appear in real-time.

2.  **Browser Console**:
    - Install the "Google Analytics Debugger" Chrome extension.
    - Check the console logs for `gtag` calls.
