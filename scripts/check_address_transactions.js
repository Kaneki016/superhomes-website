
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
let supabaseUrl = '';
let supabaseKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

    if (urlMatch) supabaseUrl = urlMatch[1].trim();
    if (keyMatch) supabaseKey = keyMatch[1].trim();
} catch (e) {
    console.error('Could not read .env.local', e);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAddress() {
    const address = 'JLN NILAM 4'; // From user screenshot
    console.log(`Checking transactions for: ${address}`);

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('address', address)
        .order('transaction_date', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} transactions.`);
    const outputPath = path.join(__dirname, 'output.json');
    fs.writeFileSync(outputPath, JSON.stringify(data.map(t => ({
        date: t.transaction_date,
        price: t.price,
        sqft: t.built_up_sqft,
        land: t.land_area_sqft,
        type: t.property_type,
        level: t.unit_level
    })), null, 2));
    console.log(`Wrote ${data.length} transactions to ${outputPath}`);
}

checkAddress();
