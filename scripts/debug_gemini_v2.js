
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

async function run() {
    try {
        console.log('Testing gemini-2.5-flash...');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent('Hello');
        const response = await result.response;
        console.log('SUCCESS:', response.text());
    } catch (e) {
        const errorInfo = `ERROR FULL OBJECT: ${JSON.stringify(e, null, 2)}\nERROR MESSAGE: ${e.message}`;
        console.error(errorInfo);
        fs.writeFileSync(path.join(__dirname, 'debug_log.txt'), errorInfo);
    }
}

run();
