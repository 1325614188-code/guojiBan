const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'views');
const allKeys = require('./extracted-static-keys.json');

function extractArray(file, arrayName) {
    const code = fs.readFileSync(path.join(viewsDir, file), 'utf8');
    const regex = new RegExp(`(?:const|let) ${arrayName}.*?=\\s*(\\[[\\s\\S]*?\\]);\\n`);
    const match = code.match(regex);
    if (match) {
        let arrString = match[1];
        try {
            return eval(`(${arrString})`);
        } catch (e) {
            console.log('Eval error for', arrayName, e.message);
        }
    }
    const fallbackRegex = new RegExp(`(?:const|let) ${arrayName}.*?=\\s*(\\[[\\s\\S]*\\n\\]);`);
    const match2 = code.match(fallbackRegex);
    if(match2) {
        try {
            return eval(`(${match2[1]})`);
        } catch (e) {
            
        }
    }
    console.log('Failed to extract', arrayName, 'from', file);
    return [];
}

const eqQs = extractArray('EQTestView.tsx', 'EQ_QUESTIONS');
eqQs.forEach((q, i) => {
    allKeys[`tests.eq_q_${i + 1}`] = q.q;
    if (q.options) {
        q.options.forEach((opt, oIdx) => Object.values(opt)[0] ? allKeys[`tests.eq_q_${i + 1}_opt_${oIdx}`] = Object.values(opt)[0] : null);
    } else if (q.opts) {
        q.opts.forEach((opt, oIdx) => allKeys[`tests.eq_q_${i + 1}_opt_${oIdx}`] = opt.text || opt);
    }
});

const mbtiQs = extractArray('MBTITestView.tsx', 'MBTI_QUESTIONS');
mbtiQs.forEach((q) => {
    allKeys[`tests.mbti_q_${q.id}`] = q.q;
    if (q.options) {
        Object.keys(q.options).forEach((optKey) => {
            allKeys[`tests.mbti_q_${q.id}_opt_${optKey}`] = q.options[optKey];
        });
    }
});

const big5Qs = extractArray('BigFiveView.tsx', 'BIG_FIVE_QUESTIONS');
big5Qs.forEach((q, i) => {
    allKeys[`tests.bf_q_${i + 1}`] = q.q;
});

const iqQs = extractArray('IQTestView.tsx', 'IQ_QUESTIONS');
iqQs.forEach((q, i) => {
    allKeys[`tests.iq_q_${i + 1}`] = q.q;
    if (q.type) allKeys[`tests.iq_type_${q.type}`] = q.type;
    if (q.options) {
        q.options.forEach((opt, oIdx) => {
            allKeys[`tests.iq_q_${i + 1}_opt_${oIdx}`] = opt;
        });
    }
});

const dpQs = extractArray('DepressionTestView.tsx', 'DEPRESSION_QUESTIONS');
dpQs.forEach((q, i) => {
    allKeys[`tests.dp_q_${i + 1}`] = q.q;
});

const maleHair = extractArray('HairstyleView.tsx', 'MALE_HAIRSTYLES');
maleHair.forEach((s) => {
    allKeys[`tests.hair_${s.id}_name`] = s.name;
    allKeys[`tests.hair_${s.id}_desc`] = s.desc;
});

const femaleHair = extractArray('HairstyleView.tsx', 'FEMALE_HAIRSTYLES');
femaleHair.forEach((s) => {
    allKeys[`tests.hair_${s.id}_name`] = s.name;
    allKeys[`tests.hair_${s.id}_desc`] = s.desc;
});

fs.writeFileSync('all-test-keys.json', JSON.stringify(allKeys, null, 2));
console.log('Total keys combined:', Object.keys(allKeys).length);
