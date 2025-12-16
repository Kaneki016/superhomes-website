---
description: Future features to implement for SuperHomes
---

# Future Features

## 🗺️ Map View (Properties Page)
**Status**: Pending  
**Priority**: Medium  

### Requirements:
1. Add `latitude` and `longitude` columns to Supabase `properties` table
2. Geocode existing property addresses to get coordinates
3. Implement map using Leaflet + OpenStreetMap (free) or Google Maps (paid)
4. Add toggle button to switch between grid/list and map views
5. Show property pins on map with popup previews

### Notes:
- `mapView` state already exists in `app/properties/page.tsx` (line 35)
- Consider using react-leaflet for Next.js integration

---

## Other Future Ideas:
- [ ] Advanced search with more filters
- [ ] Property comparison feature
- [ ] Virtual tour integration
- [ ] Mortgage calculator
- [ ] Saved searches with email alerts
