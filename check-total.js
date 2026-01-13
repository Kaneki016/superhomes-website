
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTotalCount() {
    console.log('--- Checking Total Listings Count ---');

    // 1. Total Count
    const { count: total, error: err1 } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true });

    if (err1) console.error('Error total count:', err1.message);
    else console.log(`Total Listings (Exact): ${total}`);

    // 2. Breakdown by Type (simulated via individual counts if Group By is hard in JS client without RPC)
    // Actually, let's just check known types + 'unknown'?
    // Or fetch distinct types?
    // We'll just run counts for known types first.

    const types = ['sale', 'rent', 'project', 'auction'];
    let sumKnown = 0;

    for (const type of types) {
        const { count, error } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('listing_type', type);

        if (!error) {
            console.log(`Type '${type}': ${count}`);
            sumKnown += count;
        }
    }

    console.log(`Sum of checked types: ${sumKnown}`);

    // Check if there are null listing_types
    const { count: nullType, error: errNull } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .is('listing_type', null);

    if (!errNull && nullType > 0) {
        console.log(`Null listing_type: ${nullType}`);
        sumKnown += nullType;
    }

    const diff = total - sumKnown;
    if (diff > 0) {
        console.log(`There are ${diff} listings with OTHER types.`);
        // fetch a sample
        const { data } = await supabase.from('listings').select('listing_type').not('listing_type', 'in', `(${types.map(t => `"${t}"`).join(',')})`).limit(5);
        if (data) console.log('Sample other types:', data.map(d => d.listing_type));
    }
}

checkTotalCount();
