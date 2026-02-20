
import postgres from 'postgres'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
const POSTGRES_URL = process.env.POSTGRES_URL;
let sql;

if (POSTGRES_URL) {
    sql = postgres(POSTGRES_URL)
} else {
    const dbConfig = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? 'require' : undefined,
    }

    if (!dbConfig.host) {
        console.error('Database configuration missing (DB_HOST or POSTGRES_URL)')
        process.exit(1)
    }
    sql = postgres(dbConfig)
}

async function check() {
    try {
        console.log('Checking database content for project listing types...')

        const variants = [
            'Serviced Residence',
            'Service Residence',
            'Serviced Apartment'
        ]

        for (const v of variants) {
            const result = await sql`
                SELECT count(*) as count
                FROM listings
                WHERE listing_type = 'project'
                AND property_type ILIKE ${'%' + v + '%'}
            `
            console.log(`Count for ILIKE '%${v}%':`, result[0].count)
        }

        const distinct = await sql`
            SELECT DISTINCT property_type 
            FROM listings 
            WHERE listing_type = 'project' 
            AND property_type ILIKE '%Service%'
        `
        console.log('Actual DB Values matching %Service%:', distinct)

    } catch (e) {
        console.error('Error:', e)
    } finally {
        await sql.end()
    }
}

check()
