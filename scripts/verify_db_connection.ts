
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function verify() {
    // Dynamic import ensures env vars are loaded first
    const { getProperties, getPropertiesPaginated, getDistinctStates } = await import('../lib/database');

    console.log('Testing Database Connection...');

    try {
        console.log('1. Fetching Distinct States...');
        const states = await getDistinctStates();
        console.log(`Success! Found ${states.length} states:`, states.slice(0, 3));

        console.log('\n2. Fetching Latest Properties...');
        const properties = await getProperties();
        console.log(`Success! Fetched ${properties.length} properties.`);
        if (properties.length > 0) {
            console.log('Sample Property:', properties[0].title);
            console.log('Price:', properties[0].price);
        }

        console.log('\n3. Testing Pagination...');
        const page1 = await getPropertiesPaginated(1, 5);
        console.log(`Success! Page 1 has ${page1.properties.length} items. Total: ${page1.totalCount}`);

        console.log('\n✅ Database verification successful!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Verification failed:', error);
        process.exit(1);
    }
}

verify();
