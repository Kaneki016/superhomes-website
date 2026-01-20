const https = require('https');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local to avoid dependencies
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
    console.error('API Key not found');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error('API Error:', json.error);
            } else if (json.models) {
                console.log('Available Models:');
                json.models.forEach(m => {
                    if (JSON.stringify(m).includes('generateContent')) {
                        console.log(m.name);
                    }
                });
            } else {
                console.log('Response:', data);
            }
        } catch (e) {
            console.error('Parse Error:', e);
        }
    });
}).on('error', (err) => {
    console.error('Network Error:', err);
});
