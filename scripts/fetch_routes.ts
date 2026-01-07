
import fs from 'fs'
import path from 'path'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// Query: Fetch relations by name, then recurse down to ways, output geometry.
const query = `
[out:json][timeout:180];
(
  relation["name"~"MRT Kajang Line"];
  relation["name"~"MRT Putrajaya Line"];
  relation["name"~"LRT Kelana Jaya Line"];
  relation["name"~"LRT Ampang Line"];
  relation["name"~"LRT Sri Petaling Line"];
  relation["name"~"KL Monorail"];
);
out body;
>;
out geom;
`

async function main() {
    console.log('STARTING ROBUST FETCH...')
    try {
        const response = await fetch(OVERPASS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'data=' + encodeURIComponent(query)
        })

        console.log('Response Status:', response.status)
        if (!response.ok) {
            const errText = await response.text()
            throw new Error(`HTTP Error: ${response.status} ${response.statusText} - ${errText}`)
        }

        const text = await response.text()
        console.log(`Received ${text.length} bytes.`)

        try {
            const data = JSON.parse(text)
            console.log(`Generated JSON with ${data.elements?.length} elements.`)

            const outFile = path.join(process.cwd(), 'data', 'transport_routes_final.json')
            fs.writeFileSync(outFile, text)
            console.log(`SUCCESS: Saved to ${outFile}`)
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError)
            console.log('Raw text preamble:', text.substring(0, 500))
        }

    } catch (e) {
        console.error('Error fetching routes:', e)
    }
}

main()
