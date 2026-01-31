import { config } from 'dotenv'
import postgres from 'postgres'

config({ path: '.env.local' })

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? 'require' : undefined,
}

const sql = process.env.DATABASE_URL
    ? postgres(process.env.DATABASE_URL, { ssl: 'require' })
    : postgres(dbConfig as any)

async function sample() {
    try {
        const data = await sql`
            SELECT neighborhood, district, mukim 
            FROM transactions 
            LIMIT 20
        `
        console.log(JSON.stringify(data, null, 2))
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await sql.end()
    }
}

sample()
