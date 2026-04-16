const fs = require('fs');
const path = require('path');

const locales = ['en', 'ja', 'vi', 'ko', 'es', 'fr', 'de', 'th', 'zh-TW'];
const keysMap = require('./all-test-keys.json');
const keysList = Object.keys(keysMap);
const valuesList = Object.values(keysMap);

const CHUNK_SIZE = 50;

async function translateChunk(chunk, targetLang) {
    const text = chunk.join('\n|||\n');
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=${targetLang}&dt=t`;
    
    // retry logic
    for(let i=0; i<3; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ q: text }).toString()
            });
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const json = await response.json();
            
            let translatedText = '';
            json[0].forEach(t => {
                if (t[0]) translatedText += t[0];
            });
            
            // Re-split using either \n|||\n or ||| depending on translate handling spaces
            const splitted = translatedText.split(/(?:\s*\n\s*\|\|\|\s*\n\s*|\s*\|\|\|\s*)/g);
            return splitted;
        } catch (e) {
            console.log(`Error translating to ${targetLang}, retry ${i}...`, e.message);
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    return chunk; // fallback to chinese if completely failed
}

async function main() {
    console.log(`Starting batch translation for ${keysList.length} keys...`);
    
    // Process each language
    for (const lang of locales) {
        console.log(`\nTranslating for ${lang}...`);
        
        let translatedValues = [];
        
        for (let i = 0; i < valuesList.length; i += CHUNK_SIZE) {
            const chunk = valuesList.slice(i, i + CHUNK_SIZE);
            process.stdout.write(`Chunk ${i/CHUNK_SIZE + 1}/${Math.ceil(valuesList.length/CHUNK_SIZE)}... `);
            
            const tr = await translateChunk(chunk, lang);
            
            if (tr.length !== chunk.length) {
                console.log(`\n[WARNING] Length mismatch for ${lang} chunk! Expected ${chunk.length}, got ${tr.length}. Falling back carefully.`);
                // If it fails to perfectly split, fallback this chunk individually or just fallback to Chinese
                // usually it splits properly if the delimiter is intact, but just in case:
                if (tr.length < chunk.length) {
                    translatedValues.push(...tr);
                    const missing = chunk.length - tr.length;
                    translatedValues.push(...chunk.slice(-missing)); // fallback missing
                } else {
                    translatedValues.push(...tr.slice(0, chunk.length));
                }
            } else {
                translatedValues.push(...tr);
            }
            console.log('Done');
        }
        
        // Write to file
        const filepath = path.join(__dirname, 'lib', 'locales', `${lang}.json`);
        let data = {};
        if (fs.existsSync(filepath)) {
            data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        }
        
        data.tests = data.tests || {};
        
        for (let idx = 0; idx < keysList.length; idx++) {
            const rawKey = keysList[idx]; // tests.xxx
            const cleanKey = rawKey.replace('tests.', '');
            // keep standard formatting, clean up leading whitespaces
            data.tests[cleanKey] = translatedValues[idx] ? translatedValues[idx].trim() : valuesList[idx];
        }
        
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        console.log(`Saved ${lang}.json successfully!`);
        
        // cooldown to prevent rate limits
        await new Promise(r => setTimeout(r, 1000));
    }
    console.log('\nAll translations applied successfully!');
}

main();
