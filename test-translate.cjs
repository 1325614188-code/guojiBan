const fs = require('fs');
const path = require('path');

const locales = ['en', 'ja', 'vi', 'ko', 'es', 'fr', 'de', 'th', 'zh-TW'];
const keysMap = require('./all-test-keys.json');

async function translateChunk(chunk, targetLang) {
    const text = chunk.join('\n|||\n');
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('API Error');
        const json = await response.json();
        
        let translatedText = '';
        json[0].forEach(t => {
            if (t[0]) translatedText += t[0];
        });
        
        return translatedText.split(/\n\s*\|\|\|\s*\n/);
    } catch (e) {
        console.log('Error', e);
        return Array(chunk.length).fill(''); // Fallback 
    }
}

async function main() {
    const keys = Object.keys(keysMap);
    const values = Object.values(keysMap);
    
    // First, save zh-CN natively
    const cntData = require('./lib/locales/zh-CN.json');
    cntData.tests = cntData.tests || {};
    keys.forEach(k => cntData.tests[k.replace('tests.', '')] = keysMap[k]);
    fs.writeFileSync('./lib/locales/zh-CN.json', JSON.stringify(cntData, null, 2));
    
    console.log('Saved zh-CN. Now processing other languages...');
    
    // Just a quick test for 'en' first 10 keys
    const testKeys = keys.slice(0, 5);
    const testValues = values.slice(0, 5);
    const res = await translateChunk(testValues, 'en');
    console.log('Translate test:');
    testValues.forEach((v, i) => console.log(v, '->', res[i]));
}

main();
