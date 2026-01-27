
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function analyzeHierarchy() {
    console.log('Analyzing hierarchy...')
    const { data, error } = await supabase
        .from('transactions')
        .select('district, mukim, neighborhood')
        .limit(100)

    if (error) {
        console.error('Error:', error)
        return
    }

    // specific counts
    const districts = new Set(data.map(d => d.district).filter(Boolean))
    const mukims = new Set(data.map(d => d.mukim).filter(Boolean))
    const neighborhoods = new Set(data.map(d => d.neighborhood).filter(Boolean))

    let output = `Unique Districts (${districts.size}): ${[...districts].slice(0, 10).join(', ')}\n`
    output += `Unique Mukims (${mukims.size}): ${[...mukims].slice(0, 10).join(', ')}\n`
    output += `Unique Neighborhoods (${neighborhoods.size}): ${[...neighborhoods].slice(0, 10).join(', ')}\n`

    // Check relationships
    if (data.length > 0) {
        output += '\nSample Rows:\n'
        data.slice(0, 20).forEach((row, i) => {
            output += `[${i}] District: "${row.district}" -> Mukim: "${row.mukim}" -> Neighborhood: "${row.neighborhood}"\n`
        })
    }

    fs.writeFileSync('hierarchy_output.txt', output)
    console.log('Output written to hierarchy_output.txt')
}

analyzeHierarchy()
