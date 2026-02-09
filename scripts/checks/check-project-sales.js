
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjectSales() {
    console.log('--- Checking Projects with Sale Details ---');

    // Fetch projects joined with sale details
    // limit 10
    const { data, error } = await supabase
        .from('listings')
        .select('id, listing_type, listing_sale_details(price)')
        .eq('listing_type', 'project')
        .limit(20);

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    let hasSaleDetails = 0;
    let total = data.length;

    data.forEach(item => {
        if (item.listing_sale_details) {
            if (Array.isArray(item.listing_sale_details) && item.listing_sale_details.length > 0) hasSaleDetails++;
            else if (!Array.isArray(item.listing_sale_details) && item.listing_sale_details) hasSaleDetails++;
        }
    });

    console.log(`Checked ${total} projects.`);
    console.log(`Projects with Sale Details: ${hasSaleDetails}`);

    if (hasSaleDetails > 0) {
        console.log('Sample Sale Price for Project:', Array.isArray(data[0].listing_sale_details) ? data[0].listing_sale_details[0].price : data[0].listing_sale_details.price);
    } else {
        console.log('No sale details found for projects. They likely use listing_project_details.');
    }
}

checkProjectSales();
