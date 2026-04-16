const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'lib', 'locales');
const locales = ['ko', 'es', 'fr', 'de', 'th', 'zh-TW'];

const zhData = JSON.parse(fs.readFileSync(path.join(localesDir, 'zh-CN.json')));
const enData = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json')));

const zhTests = zhData.tests || {};
const enTests = enData.tests || {};

locales.forEach(lang => {
    const file = path.join(localesDir, `${lang}.json`);
    const data = JSON.parse(fs.readFileSync(file));
    
    if (!data.tests) data.tests = {};
    
    let updated = 0;
    Object.keys(zhTests).forEach(k => {
        // If the current translation for this key is missing, or exactly equal to Chinese
        if (!data.tests[k] || data.tests[k] === zhTests[k]) {
            if (lang === 'zh-TW') {
                // Keep it simplified if traditional failed, rather than English
                data.tests[k] = zhTests[k];
            } else {
                data.tests[k] = enTests[k];
                updated++;
            }
        }
    });
    
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log(`Patched ${lang}.json with ${updated} English fallbacks.`);
});
