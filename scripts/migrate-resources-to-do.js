const fs = require('fs');
const path = require('path');

// CONFIGURATION
// Replace this with your actual Digital Ocean Space URL
// Example: 'https://my-space.sgp1.digitaloceanspaces.com'
const DO_SPACE_URL = process.env.DO_SPACE_URL || 'YOUR_DO_SPACE_URL_HERE';
const CONTENT_DIR = path.join(__dirname, '../content/resources');

if (DO_SPACE_URL === 'YOUR_DO_SPACE_URL_HERE') {
    console.error('Please set the DO_SPACE_URL environment variable or edit the script to include your Digital Ocean Space URL.');
    process.exit(1);
}

// Ensure the content directory exists
if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`Content directory not found: ${CONTENT_DIR}`);
    process.exit(1);
}

function processFiles() {
    const files = fs.readdirSync(CONTENT_DIR);
    let modifiedCount = 0;

    files.forEach(file => {
        if (path.extname(file) !== '.md') return;

        const filePath = path.join(CONTENT_DIR, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Regex to find local image paths starting with /images/resources/
        // Matches: /images/resources/filename.EXT
        const regex = /\/images\/resources\/([^)"\s]+)/g;

        if (regex.test(content)) {
            const newContent = content.replace(regex, (match, filename) => {
                return `${DO_SPACE_URL}/images/resources/${filename}`;
            });

            if (content !== newContent) {
                fs.writeFileSync(filePath, newContent, 'utf8');
                console.log(`Updated: ${file}`);
                modifiedCount++;
            }
        }
    });

    console.log(`\nMigration complete. ${modifiedCount} files updated.`);
}

processFiles();
