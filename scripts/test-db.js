require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? 'require' : undefined,
};

console.log('Connecting to DB with:', { ...dbConfig, password: '***' });

const sql = postgres({
    ...dbConfig,
    ssl: dbConfig.ssl,
    connect_timeout: 5, // 5s timeout
});

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
