import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
    // Dynamic import effectively to ensure env is ready
    const { default: sql } = await import('../lib/db');

    console.log('Creating Auth Tables...');

    try {
        // 1. Users Table (replaces/merges with Supabase auth.users concepts)
        // We link this to the existing 'contacts' (agents) and 'buyers' tables eventually
        await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        image TEXT,
        password TEXT, -- For email/password auth
        role TEXT DEFAULT 'user', -- 'agent', 'buyer', 'admin'
        email_verified TIMESTAMP WITH TIME ZONE,
        phone_verified TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
        console.log('✅ Users table created/verified');

        // 2. Accounts Table (for OAuth providers if needed later)
        await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        userId UUID REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        providerAccountId TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at BIGINT,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        UNIQUE(provider, providerAccountId)
      );
    `;
        console.log('✅ Accounts table created/verified');

        // 3. Sessions Table (for database sessions if we choose that over JWT)
        await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sessionToken TEXT UNIQUE NOT NULL,
        userId UUID REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `;
        console.log('✅ Sessions table created/verified');

        // 4. Verification Tokens (for OTPs)
        await sql`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier TEXT NOT NULL, -- Email or Phone
        token TEXT NOT NULL,      -- The OTP code
        expires TIMESTAMP WITH TIME ZONE NOT NULL,
        UNIQUE(identifier, token)
      );
    `;
        console.log('✅ Verification Tokens table created/verified');

        // 5. Add 'auth_id' to users table if it doesn't match legacy? 
        // Actually, 'contacts' and 'buyers' currently ref 'auth_id' which was Supabase UUID.
        // We should ensure our new 'users.id' can still be referenced or we migrate the FKs.
        // For now, let's keep it simple: New Auth System = New IDs. 
        // We will eventually need to update 'contacts.auth_id' to point to 'users.id'.

        console.log('Migration Complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
}

migrate();
