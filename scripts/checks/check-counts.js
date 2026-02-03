
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCounts() {
    console.log('--- Checking Property Counts ---');

    const types = ['sale', 'rent', 'project'];

    for (const type of types) {
        console.log(`\nChecking type: ${type}`);

        // 1. Exact Count (Active Only)
        const { count: exactActive, error: err1 } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('listing_type', type)
            .eq('is_active', true);

        if (err1) console.error('Error exact active:', err1.message);
        else console.log(`Active (Exact): ${exactActive}`);

        // 2. Exact Count (ALL)
        const { count: exactAll, error: err2 } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('listing_type', type);

        if (err2) console.error('Error exact all:', err2.message);
        else console.log(`Total (Exact): ${exactAll} (Inactive: ${exactAll - exactActive})`);

        // 3. Estimated Count (Active Only) - To compare
        const { count: estimatedActive, error: err3 } = await supabase
            .from('listings')
            .select('*', { count: 'estimated', head: true })
            .eq('listing_type', type)
            .eq('is_active', true);

        if (err3) console.error('Error estimated active:', err3.message);
        else console.log(`Active (Estimated): ${estimatedActive}`);

        console.log(`Discrepancy (Exact vs Estimated): ${Math.abs(exactActive - estimatedActive)}`);
    }
}

checkCounts();
