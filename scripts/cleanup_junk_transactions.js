
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
    console.log('🧹 Starting Batch Cleanup of Junk Transactions...\n');

    // 1. Get IDs of junk records to delete (fetch in chunks if necessary, but fetching IDs is cheap)
    // We will fetch and delete in loop until none remain.

    let totalDeleted = 0;
    const BATCH_SIZE = 1000;
    let hasMore = true;

    while (hasMore) {
        // Fetch a batch of IDs
        const { data: rows, error: fetchError } = await supabase
            .from('transactions')
            .select('id')
            .or('price.eq.0,price.is.null')
            .is('source_url', null)
            .limit(BATCH_SIZE);

        if (fetchError) {
            console.error('Error fetching batch:', fetchError);
            break;
        }

        if (!rows || rows.length === 0) {
            console.log('No more records found to delete.');
            hasMore = false;
            break;
        }

        const idsToDelete = rows.map(r => r.id);
        console.log(`Deleting batch of ${idsToDelete.length} records...`);

        // Delete by ID
        const { error: deleteError } = await supabase
            .from('transactions')
            .delete()
            .in('id', idsToDelete);

        if (deleteError) {
            console.error('Error deleting batch:', deleteError);
            // Stop to avoid infinite loop of errors
            break;
        }

        totalDeleted += idsToDelete.length;
        console.log(`Deleted so far: ${totalDeleted}`);

        // Brief pause to be nice to DB
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\n✅ Cleanup Complete. Total records deleted: ${totalDeleted}`);
}

main();
