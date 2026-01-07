import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
    console.log('🔍 Inspecting "transactions" table structure...\n')

    // Fetch a single row to see columns
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .limit(1)

    if (error) {
        console.error('❌ Error accessing "transactions":', error.message)
        return
    }

    if (data && data.length > 0) {
        const row = data[0]
        console.log('✅ Success! Found columns:')
        const keys = Object.keys(row)
        keys.forEach(key => {
            console.log(`   - ${key} (${typeof row[key]})`)
        })

        // Check for potential address columns
        const addressCandidates = keys.filter(k => k.toLowerCase().includes('address') || k.toLowerCase().includes('location') || k.toLowerCase().includes('place') || k.toLowerCase().includes('project'))
        console.log('\n📍 Potential address columns:', addressCandidates.join(', '))

        // Check for coordinates
        const hasLat = keys.includes('latitude') || keys.includes('lat')
        const hasLng = keys.includes('longitude') || keys.includes('lng') || keys.includes('long')
        console.log(`\n🌐 Coordinates columns:`)
        console.log(`   Latitude: ${hasLat ? '✅ Yes' : '❌ No'}`)
        console.log(`   Longitude: ${hasLng ? '✅ Yes' : '❌ No'}`)

    } else {
        console.log('✅ Table "transactions" exists but is empty.')
        console.log('   I cannot infer columns without data. Please check Supabase dashboard for column names.')
    }
}

main()
