
import fs from 'fs'
import path from 'path'

const inputFile = path.join(process.cwd(), 'data', 'transport_routes_full.json')
const outputFile = path.join(process.cwd(), 'data', 'transport_routes.ts')

const LINE_MAPPING: Record<string, string> = {
    'Kelana Jaya': 'kelana_jaya',
    'Laluan Kelana Jaya': 'kelana_jaya',
    'KL Monorail': 'monorail',
    'Monorel KL': 'monorail',
    'Kajang Line': 'kajang',
    'MRT Kajang Line': 'kajang',
    'Laluan Kajang': 'kajang',
    'Putrajaya Line': 'putrajaya',
    'MRT Putrajaya Line': 'putrajaya',
    'Laluan Putrajaya': 'putrajaya',
    'Ampang Line': 'ampang',
    'Laluan Ampang': 'ampang',
    'Sri Petaling Line': 'sri_petaling',
    'Laluan Sri Petaling': 'sri_petaling',
    // Fallbacks/Substrings
    'Kelana': 'kelana_jaya',
    'Kajang': 'kajang',
    'Putrajaya': 'putrajaya',
    'Ampang': 'ampang',
    'Sri Petaling': 'sri_petaling',
    'Monorail': 'monorail',
    'Monorel': 'monorail'
}

async function main() {
    console.log('Processing routes...')
    if (!fs.existsSync(inputFile)) {
        console.error('Input file not found:', inputFile)
        return
    }

    const raw = fs.readFileSync(inputFile, 'utf-8')
    const data = JSON.parse(raw)

    const routes: Record<string, [number, number][][]> = {
        kajang: [],
        putrajaya: [],
        kelana_jaya: [],
        ampang: [],
        sri_petaling: [],
        monorail: []
    }

    let validSegments = 0

    if (data.elements) {
        for (const el of data.elements) {
            if (el.type === 'way' && el.geometry && el.tags) {
                const name = el.tags['name:en'] || el.tags['name'] || ''
                let lineId: string | undefined

                // Match name
                for (const [key, value] of Object.entries(LINE_MAPPING)) {
                    if (name.includes(key)) {
                        lineId = value
                        break
                    }
                }

                if (lineId && routes[lineId as keyof typeof routes]) {
                    const segment: [number, number][] = el.geometry.map((pt: any) => [pt.lat, pt.lon])
                    routes[lineId as keyof typeof routes].push(segment)
                    validSegments++
                }
            }
        }
    }

    console.log(`Found ${validSegments} segments across all lines.`)

    const tsContent = `export const transportRoutes: Record<string, [number, number][][]> = ${JSON.stringify(routes, null, 2)}`

    fs.writeFileSync(outputFile, tsContent)
    console.log(`Saved to ${outputFile}`)
}

main()
