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
    console.log('--- Debugging Verification Tokens ---');
    try {
        const tokens = await sql`SELECT identifier FROM verification_tokens LIMIT 1`;
        console.log('ID in DB:', tokens[0]?.identifier);
    } catch (e) {
        console.error('Error:', e);
    }
    process.exit(0);
}
run();
