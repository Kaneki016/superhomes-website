
import { sql } from '../lib/database'

async function check() {
    try {
        const result = await sql`
            SELECT DISTINCT property_type 
            FROM listings 
            WHERE listing_type = 'project' 
            AND property_type ILIKE '%Service%'
        `
        console.log('Project types matching %Service%:', result)

        const testQuery = await sql`
            SELECT count(*) 
            FROM listings 
            WHERE listing_type = 'project' 
            AND property_type ILIKE '%Serviced Residence%'
        `
        console.log('Count for Serviced Residence:', testQuery)

        const testQuery2 = await sql`
            SELECT count(*) 
            FROM listings 
            WHERE listing_type = 'project' 
            AND property_type ILIKE '%Service Residence%'
        `
        console.log('Count for Service Residence:', testQuery2)

    } catch (e) {
        console.error(e)
    }
    process.exit(0)
}

check()
