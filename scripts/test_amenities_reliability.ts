
import { getNearbyAmenities } from '../lib/amenities';

async function testAmenitiesReliability() {
    console.log('Starting amenities reliability test...');

    // Coordinates for a known location (e.g., KLCC area)
    const lat = 3.1579;
    const lon = 101.7116;

    const iterations = 5;
    let successCount = 0;

    for (let i = 0; i < iterations; i++) {
        console.log(`\nIteration ${i + 1}/${iterations}: Fetching amenities...`);
        const start = Date.now();

        try {
            const amenities = await getNearbyAmenities(lat, lon);
            const duration = Date.now() - start;

            if (amenities.length > 0) {
                console.log(`Success! Found ${amenities.length} amenities in ${duration}ms`);
                successCount++;
            } else {
                console.warn(`Warning: improving amenities... returned empty array (might be valid if really empty, but unlikely for KLCC)`);
            }
        } catch (error) {
            const duration = Date.now() - start;
            console.error(`Failed after ${duration}ms:`, error);
        }

        // Add a small delay between requests to be nice to the API
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`\nTest complete. Success rate: ${successCount}/${iterations} (${(successCount / iterations) * 100}%)`);
}

testAmenitiesReliability().catch(console.error);
