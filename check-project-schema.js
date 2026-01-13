
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjectColumns() {
    console.log('--- Checking Project Details Schema ---');

    const { data, error } = await supabase
        .from('listing_project_details')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found in listing_project_details:');
        console.log(Object.keys(data[0]).join(', '));
        console.log('Sample row:', data[0]);
    } else {
        console.log('No project details found to inspect.');
    }
}

checkProjectColumns();
