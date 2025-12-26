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
    const { data: missingList } = await supabase
        .from('dup_properties')
        .select('id, property_name, address, state, city')
        .or('latitude.is.null,longitude.is.null')

    const lines: string[] = []
    lines.push('=== PROPERTIES MISSING COORDINATES ===')
    lines.push('Total: ' + (missingList?.length || 0))
    lines.push('')

    missingList?.forEach((p, i) => {
        lines.push((i + 1) + '. ' + (p.property_name || 'N/A'))
        lines.push('   ID: ' + p.id)
        lines.push('   Address: ' + (p.address || 'N/A'))
        lines.push('   State: ' + (p.state || p.city || 'Unknown'))
        lines.push('')
    })

    const outputPath = path.join(__dirname, 'missing_coords_report.txt')
    fs.writeFileSync(outputPath, lines.join('\n'), 'utf8')
    console.log('Saved to:', outputPath)
}

main()
