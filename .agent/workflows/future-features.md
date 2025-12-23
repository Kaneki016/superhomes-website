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

## 🏫 Nearby Amenities Enrichment (AI-Powered)
**Status**: Pending  
**Priority**: Medium  

### Requirements:
1. Enrich property data with proximity information (schools, transit, malls within 5km)
2. Use OpenStreetMap/Overpass API (free) or Google Places API (paid but accurate)
3. Calculate distances using Haversine formula from property coordinates
4. Use AI (Gemini/OpenAI) to generate natural language summaries
5. Add "Nearby Amenities" section to property detail pages

### Implementation Options:
- **Google Places API**: ~RM50-200/month, most accurate
- **OpenStreetMap + Overpass**: Free, decent coverage in Malaysia
- **Hybrid**: OSM for data + AI for summaries (recommended)

### Notes:
- Requires valid latitude/longitude coordinates (geocoding already done)
- Consider caching results to reduce API calls
- Types to query: `school`, `transit_station`, `shopping_mall`, `hospital`

---

## Other Future Ideas:
- [ ] Advanced search with more filters
- [ ] Property comparison feature
- [ ] Virtual tour integration
- [ ] Mortgage calculator
- [ ] Saved searches with email alerts

