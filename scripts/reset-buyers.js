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
    console.log('--- Resetting Buyers Table ---');
    try {
        // 1. Check count
        const count = await sql`SELECT count(*) FROM buyers`;
        console.log('Current Buyers Count:', count[0].count);

        // 2. Delete
        if (count[0].count > 0) {
            await sql`DELETE FROM buyers`;
            console.log('✅ Deleted all records from buyers table.');
        } else {
            console.log('Buyers table is already empty.');
        }

        // 3. Final Verification of ALL Auth Tables
        console.log('\n--- Final Status Check ---');
        const users = await sql`SELECT count(*) FROM users`;
        const buyers = await sql`SELECT count(*) FROM buyers`;
        const tokens = await sql`SELECT count(*) FROM verification_tokens`;
        const agents = await sql`SELECT count(*) FROM contacts WHERE is_claimed = true`;

        console.log(`Users: ${users[0].count}`);
        console.log(`Buyers: ${buyers[0].count}`);
        console.log(`Tokens: ${tokens[0].count}`);
        console.log(`Claimed Agents: ${agents[0].count}`);

    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}
run();
