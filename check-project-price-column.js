
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPriceColumn() {
    console.log('--- Checking for "price" column in listing_project_details ---');

    // Try selecting 'price' explicitly
    const { data, error } = await supabase
        .from('listing_project_details')
        .select('price')
        .limit(1);

    if (error) {
        console.log('Error selecting "price":', error.message);

        // Try selecting 'min_price' to confirm table access works
        const { data: dataMin, error: errorMin } = await supabase
            .from('listing_project_details')
            .select('min_price')
            .limit(1);

        if (errorMin) console.log('Error selecting "min_price":', errorMin.message);
        else console.log('Select "min_price" SUCCESS. Sample:', dataMin);

    } else {
        console.log('SUCCESS: "price" column exists!');
        console.log('Sample data:', data);
    }
}

checkPriceColumn();
