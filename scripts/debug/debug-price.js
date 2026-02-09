
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProjectPrice() {
    console.log('--- Inspecting RAW Project Prices ---');

    // Try selecting price and min_price
    const { data, error } = await supabase
        .from('listing_project_details')
        .select('id, price, min_price')
        .limit(5);

    if (error) {
        console.error('Error:', error.message);
        // Maybe try selecting * to see structure if columns fail
        const { data: allData, error: allError } = await supabase
            .from('listing_project_details')
            .select('*')
            .limit(1);
        if (allError) console.error('Error fetching *: ', allError.message);
        else console.log('Row sample (*):', allData);
        return;
    }

    if (data && data.length > 0) {
        data.forEach(row => {
            console.log(`\nID: ${row.id}`);
            console.log(`Price (${typeof row.price}):`, row.price);
            console.log(`Min Price (${typeof row.min_price}):`, row.min_price);

            if (typeof row.price === 'string') {
                console.log('Price characters:', row.price.split('').map(c => c.charCodeAt(0)));
            }
        });
    } else {
        console.log('No data found.');
    }
}

inspectProjectPrice();
