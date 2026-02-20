'use server'

/**
 * Nearby Amenities Utility
 * Fetches nearby points of interest using OpenStreetMap Overpass API
 * with persistent Postgres caching and Next.js server-side caching.
 *
 * Speed optimisations vs previous version:
 *  1. CREATE TABLE is run once at module load, not on every write.
 *  2. unstable_cache() wraps the entire lookup so Next.js dedups and caches
 *     results for 24 hours in the server data cache — same lat/lng = instant.
 *  3. Two Overpass endpoints tried in parallel; whichever responds first wins.
 *  4. Overpass query timeout reduced to 10s (DB cache is fast; fail quickly
 *     and surface cached data rather than hanging for 30s).
 */

import { unstable_cache } from 'next/cache'
import sql from './db'
import { Amenity, AmenityType } from './amenity-types'

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

// ── In-memory L1 cache (keyed by coord string) ────────────────────────────────
const memCache: Map<string, { data: Amenity[]; ts: number }> = new Map()
const MEM_TTL = 1000 * 60 * 60 // 1 hour

// ── One-time table initialisation ─────────────────────────────────────────────
// Runs once when the server module is first loaded, not on every request.
let tableReady = false
async function ensureTable() {
    if (tableReady) return
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS cached_amenities (
                coord_key TEXT PRIMARY KEY,
                amenities JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `
        tableReady = true
    } catch (e) {
        console.error('[amenities] Table init error:', e)
    }
}
// Fire-and-forget on module load
ensureTable()

// ── DB cache helpers ──────────────────────────────────────────────────────────
async function getCachedAmenities(coordKey: string): Promise<Amenity[] | null> {
    try {
        const [row] = await sql`
            SELECT amenities FROM cached_amenities 
            WHERE coord_key = ${coordKey} 
            LIMIT 1
        `
        if (!row?.amenities) return null
        return row.amenities as Amenity[]
    } catch {
        return null
    }
}

async function setCachedAmenities(coordKey: string, amenities: Amenity[]): Promise<void> {
    await ensureTable() // safe to call again (no-op after first success)
    try {
        await sql`
            INSERT INTO cached_amenities (coord_key, amenities)
            VALUES (${coordKey}, ${JSON.stringify(amenities)})
            ON CONFLICT (coord_key) 
            DO UPDATE SET amenities = EXCLUDED.amenities
        `
    } catch (e) {
        console.error('[amenities] DB write error:', e)
    }
}

// ── Overpass query builder ────────────────────────────────────────────────────
function buildOverpassQuery(lat: number, lon: number, radiusMeters: number): string {
    // Shorter timeout (10s) — prefer fast failure + DB cache over hanging 30s
    return `[out:json][timeout:10];
(
  nw["amenity"~"^(school|hospital)$"](around:${radiusMeters},${lat},${lon});
  nw["railway"~"^(station|halt)$"](around:${radiusMeters},${lat},${lon});
  nw["station"="light_rail"](around:${radiusMeters},${lat},${lon});
  nw["shop"="mall"](around:${radiusMeters},${lat},${lon});
);
out center;`.trim()
}

// ── Overpass fetch with mirror fallback ──────────────────────────────────────
// Tries the primary endpoint and a mirror in parallel; cancels the slower one.
const OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter', // mirror
]

async function fetchFromOverpass(query: string): Promise<OverpassElement[]> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000) // 12s hard timeout

    try {
        // Race all endpoints — whichever responds with 200 first wins
        const result = await Promise.any(
            OVERPASS_ENDPOINTS.map(async (url) => {
                const res = await fetch(url, {
                    method: 'POST',
                    body: query,
                    headers: { 'Content-Type': 'text/plain' },
                    signal: controller.signal,
                })
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const json = await res.json()
                return json.elements as OverpassElement[]
            })
        )
        // Cancel whichever other fetch is still pending
        controller.abort()
        return result
    } catch {
        return []
    } finally {
        clearTimeout(timeout)
    }
}

// ── OSM element parser ────────────────────────────────────────────────────────
function parseOverpassResponse(elements: OverpassElement[], originLat: number, originLon: number): Amenity[] {
    const amenities: Amenity[] = []
    const seen = new Set<string>()

    for (const el of elements) {
        const lat = el.lat ?? el.center?.lat
        const lon = el.lon ?? el.center?.lon
        if (!lat || !lon) continue

        const tags = el.tags || {}
        let type: AmenityType | null = null

        if (tags.amenity === 'school') type = 'school'
        else if (tags.railway === 'station' || tags.railway === 'halt' || tags.station === 'light_rail') type = 'transit'
        else if (tags.shop === 'mall') type = 'mall'
        else if (tags.amenity === 'hospital') type = 'hospital'

        if (!type) continue

        const name = tags.name || getDefaultName(type)
        const dedupKey = `${name.toLowerCase()}_${type}_${lat.toFixed(3)}_${lon.toFixed(3)}`
        if (seen.has(dedupKey)) continue
        seen.add(dedupKey)

        // Inline Haversine (avoids async calculateDistance in a tight loop)
        const R = 6371
        const dLat = (lat - originLat) * (Math.PI / 180)
        const dLon = (lon - originLon) * (Math.PI / 180)
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(originLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

        amenities.push({
            id: el.id,
            name,
            type,
            lat,
            lon,
            distance: Math.round(distance * 1000) / 1000,
        })
    }

    amenities.sort((a, b) => a.distance - b.distance)
    return amenities
}

function getDefaultName(type: AmenityType): string {
    const map: Record<AmenityType, string> = {
        school: 'School',
        transit: 'Train Station',
        mall: 'Shopping Mall',
        hospital: 'Hospital',
    }
    return map[type]
}

// ── Core fetch logic (cached by Next.js for 24h) ──────────────────────────────
// unstable_cache deduplicates overlapping server-side requests for the same key
// and persists the result in the Next.js data cache between requests.
const fetchAmenitiesCached = unstable_cache(
    async (cacheKey: string, lat: number, lon: number, radiusKm: number): Promise<Amenity[]> => {
        // L2: Postgres DB cache (survives deployments / server restarts)
        const dbResult = await getCachedAmenities(cacheKey)
        if (dbResult) return dbResult

        // L3: Live Overpass API fetch
        const radiusMeters = radiusKm * 1000
        const query = buildOverpassQuery(lat, lon, radiusMeters)
        const elements = await fetchFromOverpass(query)
        const amenities = parseOverpassResponse(elements, lat, lon)

        // Write-through to Postgres (non-blocking, fire-and-forget)
        setCachedAmenities(cacheKey, amenities)

        return amenities
    },
    ['nearby-amenities'], // cache tag
    { revalidate: 60 * 60 * 24 } // 24h Next.js server-side cache TTL
)

// ── Public API ────────────────────────────────────────────────────────────────
export async function getNearbyAmenities(
    lat: number,
    lon: number,
    radiusKm: number = 5
): Promise<Amenity[]> {
    const latNum = Number(lat)
    const lonNum = Number(lon)
    if (isNaN(latNum) || isNaN(lonNum)) return []

    // Coord key: rounded to 3 decimal places (~110m grid cell) for better hits
    const cacheKey = `${latNum.toFixed(3)},${lonNum.toFixed(3)}`

    // L1: In-memory cache (within a single server instance / hot reload)
    const mem = memCache.get(cacheKey)
    if (mem && Date.now() - mem.ts < MEM_TTL) return mem.data

    // L2/L3 via Next.js cached function
    const data = await fetchAmenitiesCached(cacheKey, latNum, lonNum, radiusKm)

    // Populate L1 on the way out
    memCache.set(cacheKey, { data, ts: Date.now() })

    return data
}

// Keep the async calculateDistance export for any callers that use it
export async function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): Promise<number> {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
