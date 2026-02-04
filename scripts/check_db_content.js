require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL || {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? 'require' : false,
});

async function check() {
    try {
        console.log('Checking database content...');

        const targetDistricts = ['Kuala Lumpur', 'Selangor', 'Klang Valley', 'Puchong', 'KLCC'];

        console.log('Target Districts:', targetDistricts);

        // Check active counts for these districts
        const matches = await sql`
            SELECT district, count(*) 
            FROM listings 
            WHERE district IN ${sql(targetDistricts)} 
            AND is_active = true 
            GROUP BY district
        `;
        console.log('Active matches by district:', matches);

        // Simulate query used in RelatedListings
        const listings = await sql`
            SELECT id, title, district, listing_type 
            FROM listings 
            WHERE is_active = true 
            AND district IN ${sql(targetDistricts)}
            ORDER BY scraped_at DESC
            LIMIT 6
        `;
        console.log('Simulated RelatedListings result count:', listings.length);
        if (listings.length > 0) {
            console.log('First listing:', listings[0]);
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sql.end();
    }
}

check();
