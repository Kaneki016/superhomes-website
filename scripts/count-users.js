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
        const result = await sql`SELECT count(*) FROM users`;
        console.log('User Count:', result[0].count);

        const contacts = await sql`SELECT count(*) FROM contacts WHERE is_claimed = true`;
        console.log('Claimed Agents:', contacts[0].count);
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}
run();
