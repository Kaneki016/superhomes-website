require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const twilio = require('twilio');

const sql = postgres({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? 'require' : false,
});

async function check() {
    console.log('--- Environment Check ---');
    console.log('DB_HOST:', process.env.DB_HOST ? 'OK' : 'MISSING');
    console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'OK' : 'MISSING');
    console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'OK' : 'MISSING');
    console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? 'OK' : 'MISSING');

    console.log('\n--- Database Table Check ---');
    try {
        const result = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'verification_tokens'
        `;
        if (result.length > 0) {
            console.log('✅ Table "verification_tokens" exists.');
            // Check columns
            const columns = await sql`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'verification_tokens'
            `;
            console.log('Columns:', columns.map(c => c.column_name).join(', '));
        } else {
            console.error('❌ Table "verification_tokens" DOES NOT exist.');
            // create it? No, just report.
        }
    } catch (e) {
        console.error('Database Error:', e.message);
    }

    console.log('\n--- Twilio Credential Check ---');
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        try {
            const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
            console.log('✅ Twilio Credentials Valid. Account Name:', account.friendlyName);
        } catch (e) {
            console.error('❌ Twilio Error:', e.message);
        }
    } else {
        console.log('Twilio credentials missing, skipping check.');
    }

    process.exit(0);
}

check();
