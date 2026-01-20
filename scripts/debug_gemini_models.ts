import * as dotenv from 'dotenv'


dotenv.config({ path: '.env.local' })

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

if (!apiKey) {
    console.error('No API Key found in .env.local')
    process.exit(1)
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`

console.log('Fetching models from:', url.replace(apiKey, 'HIDDEN_KEY'))

async function listModels() {
    try {
        const response = await fetch(url)
        const data = await response.json()

        if (data.error) {
            console.error('API Error:', data.error)
        } else if (data.models) {
            console.log('\nAvailable Models:')
            data.models.forEach((m: any) => {
                if (m.supportedGenerationMethods?.includes('generateContent')) {
                    console.log(`- ${m.name.replace('models/', '')}`)
                }
            })
        } else {
            console.log('Unexpected response:', data)
        }
    } catch (err) {
        console.error('Network Error:', err)
    }
}

listModels()
