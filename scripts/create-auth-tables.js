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

async function migrate() {
    console.log('Starting migration...');
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS verification_tokens (
                identifier TEXT NOT NULL,
                token TEXT NOT NULL,
                expires TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(identifier, token)
            )
        `;
        console.log('✅ Created verification_tokens table');

        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                name TEXT,
                email TEXT UNIQUE,
                email_verified TIMESTAMP,
                image TEXT,
                password TEXT,
                role TEXT DEFAULT 'user',
                phone TEXT UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log('✅ Created users table');

        await sql`
            CREATE TABLE IF NOT EXISTS accounts (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                type TEXT NOT NULL,
                provider TEXT NOT NULL,
                providerAccountId TEXT NOT NULL,
                refresh_token TEXT,
                access_token TEXT,
                expires_at BIGINT,
                token_type TEXT,
                scope TEXT,
                id_token TEXT,
                session_state TEXT,
                UNIQUE(provider, providerAccountId)
            )
        `;
        console.log('✅ Created accounts table');

        await sql`
            CREATE TABLE IF NOT EXISTS sessions (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                sessionToken TEXT UNIQUE NOT NULL,
                userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                expires TIMESTAMP NOT NULL
            )
        `;
        console.log('✅ Created sessions table');

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await sql.end();
    }
}

migrate();
