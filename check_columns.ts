
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

async function checkColumns() {
    try {
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'listing_project_details'
        `;

        console.log(JSON.stringify(columns, null, 2));
    } catch (error) {
        console.error('Error querying database:', error);
    }
    process.exit(0);
}

checkColumns();
