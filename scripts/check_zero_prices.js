
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
    const logFile = 'scripts/zero_price_report.txt';
    const logStream = fs.createWriteStream(logFile, { flags: 'w' });

    function log(message) {
        console.log(message);
        if (message !== undefined && message !== null) {
            logStream.write(String(message) + '\n');
        } else {
            logStream.write('\n');
        }
    }

    log('🕵️  Investigating Transactions with No Price...\n')

    // 1. Fetch total count
    const { count: totalCount, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })

    if (countError) {
        log('Error fetching count: ' + JSON.stringify(countError))
        logStream.end();
        return
    }

    // 2. Fetch Zero/Null Price records that HAVE a source_url
    const { data: noPriceRows, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .or('price.eq.0,price.is.null')
        .not('source_url', 'is', null)
        .limit(20)

    // 3. Count Total No Price
    const { count: totalNoPriceCount, error: noPriceCountError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .or('price.eq.0,price.is.null')

    // 4. Count Junk (No Source URL + No Price)
    const { count: junkCount, error: junkError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .or('price.eq.0,price.is.null')
        .is('source_url', null)


    if (fetchError || noPriceCountError || junkError) {
        log('Error fetching data: ' + JSON.stringify(fetchError || noPriceCountError || junkError))
        logStream.end();
        return
    }

    log(`Total Transactions: ${totalCount}`)
    log(`Total No-Price Records: ${totalNoPriceCount}`)
    log(`  - Junk Records (No Source URL): ${junkCount}`)
    log(`  - Potential Real Listings (With Source URL but No Price): ${totalNoPriceCount - junkCount}`)

    if (!noPriceRows || noPriceRows.length === 0) {
        log('Great! found NO listings with a Source URL but missing price. All no-price records are definitely junk.')
        logStream.end();
        return
    }

    log('\n--- Sample "Real" Listings with No Price (Source Exists) ---')
    noPriceRows.forEach((row, index) => {
        log(`\n[${index + 1}] ID: ${row.id}`)
        log(`    Date: ${row.transaction_date}`)
        log(`    Address: "${row.address}"`)
        log(`    Source URL: ${row.source_url}`)

        let rawSnippet = 'N/A';
        try {
            rawSnippet = typeof row.raw_data === 'object' ? JSON.stringify(row.raw_data).slice(0, 100) + '...' : String(row.raw_data);
        } catch (e) {
            rawSnippet = 'Error stringifying raw_data';
        }
        log(`    Raw Data Snippet: ${rawSnippet}`)

        if (rawSnippet.includes('RM')) {
            log(`    💡 Hint: "RM" found in raw_data string`)
        }
    })

    logStream.end();
}

main()
