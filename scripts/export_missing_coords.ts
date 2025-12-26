import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function main() {
    const { data: missingList, count } = await supabase
        .from('dup_properties')
        .select('id, property_name, address, state, city', { count: 'exact' })
        .or('latitude.is.null,longitude.is.null')

    const output: string[] = []
    output.push('=== PROPERTIES MISSING COORDINATES ===')
    output.push(`Total missing: ${count}`)
    output.push('')

    missingList?.forEach((p, i) => {
        output.push(`${i + 1}. ${p.property_name || 'N/A'}`)
        output.push(`   ID: ${p.id}`)
        output.push(`   Address: ${p.address || 'No address'}`)
        output.push(`   State: ${p.state || p.city || 'Unknown'}`)
        output.push('')
    })

    // Write to file
    fs.writeFileSync(
        path.join(__dirname, 'missing_coords_list.txt'),
        output.join('\n'),
        'utf8'
    )

    console.log('Report saved to scripts/missing_coords_list.txt')
    console.log('Total missing:', count)
}

main()
