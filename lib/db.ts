import 'server-only'
import postgres from 'postgres'

// Check if we have the necessary environment variables
const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // Cast necessary to satisfy strict types if needed, or ensure it matches
    ssl: process.env.DB_SSL === 'true' ? 'require' : undefined,
}

// Create the SQL connection
// This handles connection pooling automatically
const sql = postgres({
    ...dbConfig,
    ssl: dbConfig.ssl as any, // Cast to any to avoid complex type union issues with string vs boolean
    transform: {
        undefined: null, // Convert undefined to null for SQL
    },
    debug: process.env.NODE_ENV === 'development', // Log queries in dev
})

export default sql
