import 'server-only'
import postgres from 'postgres'

// Check if we have the necessary environment variables
const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? 'require' : undefined,
}

// Global declaration to prevent multiple instances in dev
const globalForPostgres = global as unknown as { sql: postgres.Sql }

// Common options
const options = {
    transform: {
        undefined: null, // Convert undefined to null for SQL
    },
    debug: process.env.NODE_ENV === 'development', // Log queries in dev
    max: 5, // Limit max connections per instance (reduced from 10)
    idle_timeout: 5, // Close idle connections after 5s (reduced from 20)
    connect_timeout: 10, // Connection timeout in seconds
}

// Use DATABASE_URL if available (common in production/Netlify), otherwise use individual vars
// Sanitize DATABASE_URL if it exists (remove quotes if user added them in secrets)
const connectionString = process.env.DATABASE_URL?.replace(/^["']|["']$/g, '')

const sql = globalForPostgres.sql || (connectionString
    ? postgres(connectionString, {
        ...options,
        // Ensure SSL is used if connecting to a remote DB via URL (usually requires SSL)
        // Unless explicitly disabled or handled in the URL query params, but 'require' is safer for DO
        ssl: 'require'
    })
    : postgres({
        ...options,
        ...dbConfig,
        ssl: dbConfig.ssl as any,
    }))

if (process.env.NODE_ENV !== 'production') globalForPostgres.sql = sql

export default sql
