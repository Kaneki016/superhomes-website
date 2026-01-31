import { config } from 'dotenv'
import postgres from 'postgres'

// Load environment variables
config({ path: '.env.local' })

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? 'require' : undefined,
}

// Use DATABASE_URL if available
const sql = process.env.DATABASE_URL
    ? postgres(process.env.DATABASE_URL, { ssl: 'require' })
    : postgres(dbConfig as any)

async function main() {
    console.log('🔍 simulating frontend query...\n')

    try {
        const limit = 1000
        // Equivalent Query
        const data = await sql`
            SELECT * FROM transactions 
            WHERE latitude IS NOT NULL 
            AND latitude != -99 
            ORDER BY transaction_date DESC 
            LIMIT ${limit}
        `

        console.log('✅ Success! Read', data.length, 'rows.')
        if (data.length > 0) {
            console.log('Sample row latitude:', data[0].latitude)
        }
    } catch (error) {
        console.log('❌ Error:', error)
    } finally {
        await sql.end()
    }
}

main()
