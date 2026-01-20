
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
    console.table(data.map(t => ({
        date: t.transaction_date,
        price: t.price,
        id: t.id,
        sqft: t.built_up_sqft,
        land: t.land_area_sqft,
        type: t.property_type,
        level: t.unit_level
    })));
}

checkAddress();
