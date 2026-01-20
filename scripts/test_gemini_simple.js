const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
let apiKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GOOGLE_GENERATIVE_AI_API_KEY=(.*)/);
    if (match && match[1]) {
        apiKey = match[1].trim();
    }
} catch (e) {
    console.error('Could not read .env.local');
}

if (!apiKey) {
    console.error('No API Key found');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
// Trying gemini-1.5-flash explicitly as it appeared in the list
const candidates = [
    'gemini-1.5-flash',
    'models/gemini-1.5-flash',
    'gemini-pro',
    'gemini-1.0-pro',
    'gemini-2.0-flash-exp'
];

async function run() {
    for (const modelName of candidates) {
        try {
            console.log(`Testing ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Hello');
            const response = await result.response;
            console.log(`SUCCESS with ${modelName}:`, response.text());
            return; // Exit on first success
        } catch (e) {
            console.log(`Failed ${modelName}:`, e.message.split('\n')[0]);
        }
    }
    console.error('All models failed.');
}

run();
