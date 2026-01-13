
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjectImages() {
    console.log('--- Inspecting Project Images ---');

    // Check columns of listing_project_details
    const { data, error } = await supabase
        .from('listing_project_details')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('Sample Data Keys:', Object.keys(data[0]));
        console.log('Sample Row:', data[0]);
    } else {
        console.log('No data found.');
    }

    // Also check if listings table has images for these projects
    const { data: listings, error: listError } = await supabase
        .from('listings')
        .select('id, main_image_url, images')
        .eq('listing_type', 'project')
        .limit(5);

    if (listings) {
        console.log('\n--- Sample Listings Images ---');
        listings.forEach(l => {
            console.log(`ID: ${l.id}`);
            console.log(`Main Image: ${l.main_image_url}`);
            console.log(`Images: ${l.images ? l.images.length : 0} items`);
        });
    }
}

checkProjectImages();
