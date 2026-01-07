
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkColumns() {
    console.log('Checking transactions table columns...')

    // Fetch a single row to inspect keys
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error fetching transactions:', error)
        return
    }

    if (data && data.length > 0) {
        const keys = Object.keys(data[0])
        console.log('Available columns:', keys)
        console.log('Sample row:', data[0])

        // Check specifically for state, district, postcode
        const hasState = keys.includes('state')
        const hasDistrict = keys.includes('district')
        const hasPostcode = keys.includes('postcode') // or 'postal_code'

        console.log('Has State:', hasState)
        console.log('Has District:', hasDistrict)
        console.log('Has Postcode:', hasPostcode)

    } else {
        console.log('No data found in transactions table.')
    }
}

checkColumns()
