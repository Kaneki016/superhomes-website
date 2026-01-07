import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
    console.log('🔍 Starting Brute-force Table Discovery...\n')

    // Common table names to check
    const candidates = [
        'properties', 'property', 'dup_properties', 'duplicate_properties',
        'listings', 'listing', 'all_listings', 'active_listings',
        'houses', 'house', 'homes', 'home',
        'real_estate', 'realestate',
        'units', 'unit',
        'projects', 'project',
        'scraper_data', 'scraped_properties',
        'condos', 'landed',
        'agent_listings'
    ]

    console.log(`Checking ${candidates.length} candidate names...`)

    for (const table of candidates) {
        // Try to fetch just one row, one column
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1)

        if (!error) {
            console.log(`✅ FOUND: "${table}" (Accessible)`)
            // Print columns to verify it's the right one
            if (data && data.length > 0) {
                console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`)
            } else {
                console.log(`   (Table is empty but accessible)`)
            }
        } else {
            // Check error message to distinguish "Not Found" from "Permission Denied"
            // PostgREST typically returns "relation \"public.tablename\" does not exist" or 404
            const msg = error.message.toLowerCase()
            const code = error.code

            if (msg.includes('does not exist') || code === '42P01') {
                // process.stdout.write('.') // Compact progress
            } else if (code === '42501' || msg.includes('permission denied')) {
                console.log(`🔒 FOUND: "${table}" (Permission Denied - RLS protected)`)
            } else {
                console.log(`❓ "${table}": ${error.message} (${error.code})`)
            }
        }
    }
    console.log('\n\nSearch complete.')
}

main()
