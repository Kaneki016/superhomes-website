require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const sql = postgres({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? 'require' : false,
});

async function run() {
    try {
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'listings'
            ORDER BY column_name
        `;
        const hasViewCount = columns.some(c => c.column_name === 'view_count');
        console.log('Listings Table Columns:');
        columns.forEach(c => console.log(`- ${c.column_name} (${c.data_type})`));
        console.log(`\nHas view_count: ${hasViewCount}`);
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}
run();
