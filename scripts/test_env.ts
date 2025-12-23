import { config } from 'dotenv'

// Load environment variables from .env.local
config({ path: '.env.local' })

console.log('🔍 Checking environment variables...\n')

const envVars = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY': process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
    'SUPABASE_JWT_SECRET': process.env.SUPABASE_JWT_SECRET,
    'GOOGLE_MAPS_API_KEY': process.env.GOOGLE_MAPS_API_KEY
}

for (const [key, value] of Object.entries(envVars)) {
    if (value) {
        const masked = value.substring(0, 10) + '...' + value.substring(value.length - 4)
        console.log(`✅ ${key}: ${masked} (${value.length} chars)`)
    } else {
        console.log(`❌ ${key}: NOT FOUND`)
    }
}

console.log('\n📊 Total variables loaded:', Object.values(envVars).filter(v => v).length)
