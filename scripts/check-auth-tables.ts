import { config } from 'dotenv'
import postgres from 'postgres'

config({ path: '.env.local' })

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

async function main() {
    console.log('Checking Auth Tables...')
    try {
        const users = await sql`SELECT count(*) FROM information_schema.tables WHERE table_name = 'users'`
        const tokens = await sql`SELECT count(*) FROM information_schema.tables WHERE table_name = 'verification_tokens'`

        console.log(`Users table exists: ${users[0].count > 0}`)
        console.log(`Verification Tokens table exists: ${tokens[0].count > 0}`)

        if (users[0].count > 0) {
            // Check columns
            const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`
            console.log('Users columns:', cols.map(c => c.column_name).join(', '))
        }

    } catch (e) {
        console.error('Error checking tables:', e)
    } finally {
        await sql.end()
    }
}

main()
