
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL?.replace(/^["']|["']$/g, '');

const sql = connectionString
    ? postgres(connectionString, { ssl: 'require' })
    : postgres({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? 'require' : undefined,
    });

async function checkTenure() {
    console.log('Checking tenure distribution for projects...');
    try {
        const query = await sql`
            SELECT 
                lpd.tenure, 
                COUNT(*) as count
            FROM listing_project_details lpd
            JOIN listings l ON l.id = lpd.listing_id
            WHERE l.is_active = true
            GROUP BY lpd.tenure
            ORDER BY count DESC
        `;

        console.log('Tenure counts for active projects:');
        console.table(query);

        const nullTenure = await sql`
             SELECT count(*) as count
             FROM listing_project_details lpd
             JOIN listings l ON l.id = lpd.listing_id
             WHERE l.is_active = true AND lpd.tenure IS NULL
        `;
        console.log('Projects with NULL tenure:', nullTenure[0].count);

    } catch (error) {
        console.error('Error querying database:', error);
    }
    process.exit(0);
}

checkTenure();
