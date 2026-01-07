
/**
 * Export Transactions to CSV
 * 
 * Exports the entire 'transactions' table to a CSV file.
 * handled in batches to avoid memory issues.
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BATCH_SIZE = 1000
const OUTPUT_FILE = 'transactions_export.csv'

// Helper to escape CSV fields
function escapeCsv(field: any): string {
    if (field === null || field === undefined) return ''
    const stringField = String(field)
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`
    }
    return stringField
}

async function main() {
    console.log(`📦 Starting Export to ${OUTPUT_FILE}...\n`)

    const stream = fs.createWriteStream(OUTPUT_FILE, { flags: 'w' })

    // 1. Get total count
    const { count, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })

    if (countError) {
        console.error('Error getting count:', countError)
        return
    }

    console.log(`Total records to export: ${count}`)

    // 2. Fetch headers (from first row) purely for CSV structure
    const { data: sample } = await supabase.from('transactions').select('*').limit(1)
    if (!sample || sample.length === 0) {
        console.log('No data to export.')
        return
    }

    const headers = Object.keys(sample[0])
    stream.write(headers.join(',') + '\n')

    // 3. Batch process
    let processed = 0
    let hasMore = true
    let page = 0

    while (hasMore) {
        const { data: rows, error } = await supabase
            .from('transactions')
            .select('*')
            .range(page * BATCH_SIZE, (page + 1) * BATCH_SIZE - 1)
            .order('id', { ascending: true })

        if (error) {
            console.error(`Error fetching page ${page}:`, error)
            break
        }

        if (!rows || rows.length === 0) {
            hasMore = false
            break
        }

        // Write rows
        for (const row of rows) {
            const line = headers.map(header => escapeCsv(row[header])).join(',')
            stream.write(line + '\n')
        }

        processed += rows.length
        process.stdout.write(`\rExported: ${processed} / ${count} (${Math.round(processed / count! * 100)}%)`)

        page++
    }

    stream.end()
    console.log(`\n\n✅ Export Complete! File saved to: ${path.resolve(OUTPUT_FILE)}`)
}

main()
