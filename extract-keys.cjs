const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'views');
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.tsx'));

const extracted = {};

const regex = /t\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*\)/g;

files.forEach(file => {
    const code = fs.readFileSync(path.join(viewsDir, file), 'utf8');
    let match;
    while ((match = regex.exec(code)) !== null) {
        const key = match[1];
        const defaultText = match[2];
        if (key.startsWith('tests.')) {
            extracted[key] = defaultText;
        }
    }
});

fs.writeFileSync('extracted-test-keys.json', JSON.stringify(extracted, null, 2));
console.log('Extracted', Object.keys(extracted).length, 'keys');
