require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const sql = postgres({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? 'require' : false,
});

async function reset() {
    console.log('--- Checking & Resetting Auth Data ---');

    try {
        // 1. Check for specific user
        const specificUser = await sql`SELECT * FROM users WHERE email = 'fareedaidil1810@gmail.com'`;
        if (specificUser.length > 0) {
            console.log('Found specific user (fareedaidil1810@gmail.com):', specificUser.map(u => u.id));
        } else {
            console.log('User fareedaidil1810@gmail.com NOT found.');
        }

        // 2. Check total users
        const allUsers = await sql`SELECT * FROM users`;
        console.log(`Total registered users found: ${allUsers.length}`);
        if (allUsers.length > 0) {
            allUsers.forEach(u => console.log(`- ${u.email || u.phone} (${u.role})`));
        }

        // 3. Reset Data
        console.log('\n--- Deleting Data ---');

        // Delete all users (Cascades to accounts, sessions)
        if (allUsers.length > 0) {
            await sql`DELETE FROM users`;
            console.log('✅ Deleted all users (and cascaded accounts/sessions).');
        } else {
            console.log('No users to delete.');
        }

        // Clear verification tokens
        await sql`DELETE FROM verification_tokens`;
        console.log('✅ Cleared verification_tokens.');

        // Reset Contacts (Unlink agents)
        // We only reset those that have an auth_id set, to avoid messing up unclaimed ones
        const result = await sql`
            UPDATE contacts 
            SET auth_id = NULL, is_claimed = FALSE, contact_type = NULL
            WHERE auth_id IS NOT NULL OR is_claimed = TRUE
        `;
        console.log(`✅ Unlinked agents: ${result.count} records updated in contacts table.`);

    } catch (e) {
        console.error('Error during reset:', e);
    } finally {
        await sql.end();
    }
}

reset();
