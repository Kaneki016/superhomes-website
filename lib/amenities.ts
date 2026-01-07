/**
 * Nearby Amenities Utility
 * Fetches nearby points of interest using OpenStreetMap Overpass API
 */

// Types
export interface Amenity {
    id: number
    name: string
    type: AmenityType
    lat: number
    lon: number
    distance: number // in km
}

export type AmenityType = 'school' | 'transit' | 'mall' | 'hospital'

interface OverpassElement {
    type: string
    id: number
    lat?: number
    lon?: number
    center?: { lat: number; lon: number }
    tags?: {
        name?: string
        [key: string]: string | undefined
    }
}

// Simple in-memory cache (key: "lat,lng", value: amenities)
const cache: Map<string, { data: Amenity[]; timestamp: number }> = new Map()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180)
}

/**
 * Build Overpass API query for nearby amenities
 */
function buildOverpassQuery(lat: number, lon: number, radiusMeters: number): string {
    return `
[out:json][timeout:15];
(
  nwr["amenity"~"^(school|hospital)$"](around:${radiusMeters},${lat},${lon});
  nwr["railway"~"^(station|halt)$"](around:${radiusMeters},${lat},${lon});
  nwr["station"="light_rail"](around:${radiusMeters},${lat},${lon});
  nwr["shop"="mall"](around:${radiusMeters},${lat},${lon});
);
out center;
`.trim()
}

/**
 * Parse Overpass API response into Amenity objects
 */
function parseOverpassResponse(elements: OverpassElement[], originLat: number, originLon: number): Amenity[] {
    const amenities: Amenity[] = []
    // Track seen amenities by name to avoid duplicates
    // Same place can appear as both node and way in OSM
    const seen = new Set<string>()

    for (const el of elements) {
        // Get coordinates (nodes have lat/lon directly, ways have center)
        const lat = el.lat ?? el.center?.lat
        const lon = el.lon ?? el.center?.lon

        if (!lat || !lon) continue

        // Determine amenity type
        let type: AmenityType | null = null
        const tags = el.tags || {}

        if (tags.amenity === 'school') {
            type = 'school'
        } else if (tags.railway === 'station' || tags.railway === 'halt' || tags.station === 'light_rail') {
            type = 'transit'
        } else if (tags.shop === 'mall') {
            type = 'mall'
        } else if (tags.amenity === 'hospital') {
            type = 'hospital'
        }

        if (!type) continue

        // Get name or generate default
        const name = tags.name || getDefaultName(type)

        // Create unique key for deduplication
        // Use name + type + rounded coordinates to identify duplicates
        const dedupKey = `${name.toLowerCase()}_${type}_${lat.toFixed(3)}_${lon.toFixed(3)}`

        if (seen.has(dedupKey)) continue
        seen.add(dedupKey)

        // Calculate distance (store with 3 decimals for proper formatting)
        const distance = calculateDistance(originLat, originLon, lat, lon)

        amenities.push({
            id: el.id,
            name,
            type,
            lat,
            lon,
            distance: Math.round(distance * 1000) / 1000 // Round to 3 decimals (meters precision)
        })
    }

    // Sort by distance
    amenities.sort((a, b) => a.distance - b.distance)

    return amenities
}

function getDefaultName(type: AmenityType): string {
    switch (type) {
        case 'school':
            return 'School'
        case 'transit':
            return 'Train Station'
        case 'mall':
            return 'Shopping Mall'
        case 'hospital':
            return 'Hospital'
    }
}

/**
 * Fetch nearby amenities for a given location
 */
export async function getNearbyAmenities(
    lat: number,
    lon: number,
    radiusKm: number = 5
): Promise<Amenity[]> {
    // Ensure inputs are numbers (runtime safety)
    const latNum = Number(lat)
    const lonNum = Number(lon)

    if (isNaN(latNum) || isNaN(lonNum)) return []

    // Check cache first
    const cacheKey = `${latNum.toFixed(4)},${lonNum.toFixed(4)}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
    }

    const radiusMeters = radiusKm * 1000
    // Increase timeout to 30s in the query
    const query = buildOverpassQuery(latNum, lonNum, radiusMeters).replace('[timeout:15]', '[timeout:30]')

    const MAX_RETRIES = 3
    const INITIAL_BACKOFF = 1000 // 1s

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s client-side timeout

            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: query,
                headers: {
                    'Content-Type': 'text/plain'
                },
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                // If 429 (Too Many Requests) or 5xx, we might want to retry
                if (response.status === 429 || response.status >= 500) {
                    throw new Error(`Overpass API error: ${response.status}`)
                }
                console.error('Overpass API error:', response.status)
                return []
            }

            const data = await response.json()
            const amenities = parseOverpassResponse(data.elements || [], latNum, lonNum)

            // Cache the result
            cache.set(cacheKey, { data: amenities, timestamp: Date.now() })

            return amenities
        } catch (error) {
            const isLastAttempt = attempt === MAX_RETRIES
            // Don't log abort errors if we're going to retry, unless it's the last attempt
            if (isLastAttempt) {
                console.error(`Error fetching nearby amenities (Attempt ${attempt}/${MAX_RETRIES}):`, error)
                return []
            }

            // Wait before retrying (exponential backoff)
            const delay = INITIAL_BACKOFF * Math.pow(2, attempt - 1)
            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }

    return []
}

/**
 * Group amenities by type, limiting each category
 */
export function groupAmenitiesByType(
    amenities: Amenity[],
    limitPerType: number = 3
): Record<AmenityType, Amenity[]> {
    const groups: Record<AmenityType, Amenity[]> = {
        school: [],
        transit: [],
        mall: [],
        hospital: []
    }

    for (const amenity of amenities) {
        if (groups[amenity.type].length < limitPerType) {
            groups[amenity.type].push(amenity)
        }
    }

    return groups
}
