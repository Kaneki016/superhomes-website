import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function run() {
    const { getTransactions } = await import('../lib/database')
    console.log('Testing getTransactions...')
    try {
        const filters = {
            minPrice: 0,
            maxPrice: 5000000,
            searchQuery: 'Jalan'
        }
        console.log('Calling with filters:', filters)
        const data = await getTransactions(1, filters)
        console.log('Success! Data length:', data.length)
        if (data.length > 0) {
            console.log('Sample address:', data[0].address)
        }
    } catch (err) {
        console.error('Caught error:', err)
    }
}

run()
