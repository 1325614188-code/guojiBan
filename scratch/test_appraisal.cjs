const { GoogleAuth } = require('google-auth-library');

async function getAccessToken() {
  const keyStr = process.env.GCP_SERVICE_ACCOUNT_KEY;
  const project = process.env.GCP_PROJECT_ID;

  if (!keyStr) {
      throw new Error('GCP_SERVICE_ACCOUNT_KEY is not defined in process.env');
  }

  let sanitizedKey = keyStr.trim();
  if (sanitizedKey.startsWith('"') && sanitizedKey.endsWith('"')) {
      sanitizedKey = sanitizedKey.substring(1, sanitizedKey.length - 1).replace(/\\"/g, '"');
  }
  
  const credentials = JSON.parse(sanitizedKey);
  const auth = new GoogleAuth({
      credentials,
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token;
}

async function callVertexAI(modelName, payload) {
  const project = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_LOCATION || 'us-central1';
  const token = await getAccessToken();

  const url = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${project}/locations/${location}/publishers/google/models/gemini-2.5-flash:generateContent`;

  console.log(`[Test Vertex AI] Sending request to ${url}...`);

  const response = await fetch(url, {
      method: 'POST',
      headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
  });

  if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vertex API Error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

async function startTest() {
  const dummyImageBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

  const jadeSchema = `{
      "authenticity": { 
          "conclusion": "例如：天然翡翠A货 / 经过酸洗充胶处理的B货 / 人造仿冒品 等严谨鉴定结论", 
          "reasons": ["依据一：表面是否有酸蚀网纹", "依据二：是否有强光反射起荧特征", "依据三：结构松散度与杂质状况"], 
          "riskLevel": "low|medium|high",
          "probability": "天然A货可能性百分比，如：98%"
      },
      "quality": { 
          "color": "翡翠的颜色描述，如阳绿、满绿、白底青、无色等", 
          "transparency": "水头评价，如玻璃种、冰种、冰糯种、细糯种、豆种等", 
          "texture": "种质特征，如质地细腻紧密、结晶颗粒粗大等", 
          "craftsmanship": "雕工和整体做工评价", 
          "overallGrade": "整体品质综合档次评定" 
      },
      "valuation": {
          "priceRange": "估值区间，如：¥12,000 - ¥18,000 元 (AI结合品相估算，仅供参考)",
          "collectibility": "收藏与佩戴级别，如：日常佩戴级 / 轻度收藏级 / 传家收藏级"
      },
      "detailedAnalysis": "Markdown 格式的深度专业分析报告。必须严格、依次包含以下 7 个核心的行业标准检测维度及中英双语小标题。每个小标题前必须加上【### 】作为 Markdown 三级标题且独立占一行，标题前必须包含数字序号（1-7），字数要求在400字以上，排版要优雅工整：\\n\\n### 1. 种水 (Type and Water/Transparency)：\\n[分析样品的种地，如玻璃种/冰种/糯种/豆种等，并评估其透明度（几分水）与晶体细腻致密度]\\n\\n### 2. 色泽 (Color)：\\n[剖析颜色的分布特性，是否具有天然色根与渐变层次，颜色饱和度与是否属于邪色]\\n\\n### 3. 棉絮 (Cotton)：\\n[评估内部絮状物、天然棉絮的多寡、结构形态及其对通透度和美观度的整体影响]\\n\\n### 4. 石纹 (Stone Veins) 与 裂纹 (Cracks)：\\n[严格辨识是否带有天然石纹（无害）或由于外力及加工造成的破坏性微裂隙（有害）]\\n\\n### 5. 瑕疵 (Blemishes)：\\n[分析黑点、脏点、杂质、共生矿物包裹体等多角度微观特征]\\n\\n### 6. 荧光反应 (Fluorescence/Glow) 与 起胶/起光 (Gelatinous/Luster Effect)：\\n[深度探讨在折射/反射光下翡翠表面的起莹（荧）、起胶、刚性光泽表现，以判定内部结构的致密度及有无充胶B货迹象]\\n\\n### 7. 物理特性解释 (Physical Properties Explanation)：\\n[用最专业的矿物物理学原理，例如解释致色元素铬（Cr）和铁（Fe）的均温分布特征、纤维交织结构的透光原理、天然玻璃光泽的硬度（莫氏硬度6.5-7）以及折射率（1.66）表现对成色的内在物理支持。]"
  }`;

  const systemInstruction = `你是一位资深的翡翠珠宝鉴定与评估专家。请严格分析用户上传的多张翡翠图片（可能包括自然光正面照、强光透照、微距起荧照等）。
必须输出一个且仅一个符合以下 JSON 格式要求的 JSON 对象，绝对不要包含任何额外的自然语言废话，且必须使用中文输出内容：\n${jadeSchema}`;

  const payload = {
      contents: [{
          role: 'user',
          parts: [
              { inlineData: { mimeType: 'image/jpeg', data: dummyImageBase64 } },
              { text: "请开始深度分析并返回 JSON 报告。" }
          ]
      }],
      generationConfig: { 
          temperature: 0.2,
          responseMimeType: "application/json"
      },
      systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  try {
      const response = await callVertexAI('gemini-2.5-flash', payload);
      const rawText = response.candidates[0].content.parts[0].text;
      console.log('\n--- [SUCCESS] RAW TEXT FROM GEMINI ---');
      console.log(rawText);
      console.log('--------------------------------------');
      
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : rawText;
      const parsed = JSON.parse(cleanJson);
      
      console.log('\n--- [PARSED RESULT] ---');
      console.log('Parsed Keys:', Object.keys(parsed));
      console.log('Authenticity:', parsed.authenticity);
      console.log('Quality:', parsed.quality);
      console.log('Valuation:', parsed.valuation);
      console.log('Detailed Analysis Length:', parsed.detailedAnalysis ? parsed.detailedAnalysis.length : 0);
  } catch(e) {
      console.error('\n--- [TEST FAILED] ---');
      console.error(e);
  }
}

startTest();
