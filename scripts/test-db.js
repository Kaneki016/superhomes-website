require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

// Mirroring lib/db.ts logic
const options = {
    // transform: { undefined: null }, // Not strictly needed for simple test
    debug: true,
    max: 10,
    idle_timeout: 20,
}

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? 'require' : undefined,
}

console.log('Testing connection logic...');

let sql;
if (process.env.DATABASE_URL) {
    console.log('Using DATABASE_URL from env');
    sql = postgres(process.env.DATABASE_URL, {
        ...options,
        ssl: 'require' // DO usually needs SSL
    });
} else {
    console.log('Using individual DB vars');
    sql = postgres({
        ...options,
        ...dbConfig,
        ssl: dbConfig.ssl
    });
}

async function test() {
    try {
        console.log('Running query...');
        const result = await sql`SELECT 1 as val`;
        console.log('Query successful:', result);
        console.log('Checking transactions table...');
        const tx = await sql`SELECT count(*) FROM transactions`;
        console.log('Transactions count:', tx);
    } catch (err) {
        console.error('DB Connection Failed:', err);
    } finally {
        await sql.end();
    }
}

test();
