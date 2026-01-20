import { GoogleGenerativeAI } from '@google/generative-ai'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

console.log('API Key present:', !!apiKey)
console.log('API Key starts with:', apiKey?.substring(0, 5))

if (!apiKey) {
    console.error('No API Key found!')
    process.exit(1)
}

const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

async function run() {
    try {
        console.log('Sending test prompt...')
        const result = await model.generateContent('Say hello')
        const response = await result.response
        const text = response.text()
        console.log('Success! Response:', text)
    } catch (error) {
        console.error('Error:', error)
    }
}

run()
