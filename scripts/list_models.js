
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

async function listModels() {
    try {
        // Native fetch is available in Node 18+, so we just use 'fetch' directly.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        const log = `Models: ${JSON.stringify(data, null, 2)}`;
        console.log(log);
        fs.writeFileSync(path.join(__dirname, 'available_models.txt'), log);
    } catch (e) {
        console.error('Error listing models:', e);
        fs.writeFileSync(path.join(__dirname, 'available_models.txt'), `Error: ${e.message}`);
    }
}

listModels();
