
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
        // Ensure message is a string before writing
        logStream.write(String(message) + '\n');
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

    // 2. Fetch Zero/Null Price records
    const { data: noPriceRows, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .or('price.eq.0,price.is.null')
        .limit(20)

    const { count: noPriceCount, error: noPriceCountError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .or('price.eq.0,price.is.null')

    if (fetchError || noPriceCountError) {
        log('Error fetching zero price rows: ' + JSON.stringify(fetchError || noPriceCountError))
        logStream.end();
        return
    }

    log(`Total Transactions: ${totalCount}`)
    const ratio = totalCount ? ((noPriceCount / totalCount) * 100).toFixed(2) : 0;
    log(`Transactions with No Price (0 or NULL): ${noPriceCount} (${ratio}%)`)

    if (!noPriceRows || noPriceRows.length === 0) {
        log('Great! No transactions with missing prices found.')
        logStream.end();
        return
    }

    log('\n--- Sample Records with No Price ---')
    noPriceRows.forEach((row, index) => {
        log(`\n[${index + 1}] ID: ${row.id}`)
        log(`    Date: ${row.transaction_date}`)
        log(`    Address: ${row.address}`)
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

    log('\n--- Analysis ---')
    log('Possible reasons for 0 price:')
    log('1. "Price on Ask" or "Contact Agent" listings.')
    log('2. Auction properties (sometimes listed with reserve price, sometimes 0).')
    log('3. Data scraping errors (price selector changed).')
    log('4. Legacy data migration issues.')

    // Wait for the stream to drain before exiting? In simple script, end() usually suffices.
    logStream.end();
}

main()
