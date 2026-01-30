require('dotenv').config({ path: '.env.local' })
const postgres = require('postgres')

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? 'require' : undefined,
}

const sql = postgres({
    ...dbConfig,
    ssl: dbConfig.ssl,
})

async function main() {
    console.log('🚀 Deploying Auth Schema...')

    try {
        // Enable pgcrypto for UUID generation
        await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`
        console.log('✅ Extension pgcrypto enabled')

        // 1. Create users table
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT,
                email TEXT UNIQUE,
                email_verified TIMESTAMP,
                image TEXT,
                password TEXT,
                phone TEXT UNIQUE,
                role TEXT DEFAULT 'user',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `
        console.log('✅ Created users table')

        // 2. Create verification_tokens table
        await sql`
            CREATE TABLE IF NOT EXISTS verification_tokens (
                identifier TEXT NOT NULL,
                token TEXT NOT NULL,
                expires TIMESTAMP NOT NULL,
                PRIMARY KEY (identifier, token)
            );
        `
        console.log('✅ Created verification_tokens table')

        console.log('🎉 Schema deployment complete!')
    } catch (error) {
        console.error('❌ Error deploying schema:', error)
    } finally {
        await sql.end()
    }
}

main()
