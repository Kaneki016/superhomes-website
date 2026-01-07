import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
    console.log('🔍 Analyzing filter categories...\n')

    // Property Types
    const { data: types } = await supabase
        .from('transactions')
        .select('property_type')
        .not('property_type', 'is', null)

    if (types) {
        const unique = [...new Set(types.map(t => t.property_type))].sort()
        console.log('🏠 Property Types:', unique.join(', '))
    }

    // Tenure
    const { data: tenures } = await supabase
        .from('transactions')
        .select('tenure')
        .not('tenure', 'is', null)

    if (tenures) {
        const unique = [...new Set(tenures.map(t => t.tenure))].sort()
        console.log('📜 Tenures:', unique.join(', '))
    }
}

main()
