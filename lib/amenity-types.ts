
export interface Amenity {
    id: number
    name: string
    type: AmenityType
    lat: number
    lon: number
    distance: number // in km
}

export type AmenityType = 'school' | 'transit' | 'mall' | 'hospital'

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
