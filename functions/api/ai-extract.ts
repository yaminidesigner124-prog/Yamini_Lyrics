interface Env {
  GEMINI_API?: string;
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
  GROQ_API?: string;
  DB?: any;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const body: any = await context.request.json().catch(() => ({}));
    const { imageBase64, mimeType = 'image/jpeg', rawText } = body;

    let geminiApiKey = context.env.GEMINI_API || context.env.GEMINI_API_KEY;
    let groqApiKey = context.env.GROQ_API_KEY || context.env.GROQ_API;

    // Retrieve keys from Cloudflare D1 settings table if not in environment
    if (context.env.DB && (!geminiApiKey || !groqApiKey)) {
      try {
        const rows = await context.env.DB.prepare("SELECT key, value FROM settings WHERE key IN ('gemini_api_key', 'groq_api_key')").all();
        if (rows && rows.results) {
          for (const row of rows.results as any[]) {
            if (row.key === 'gemini_api_key' && !geminiApiKey) geminiApiKey = row.value;
            if (row.key === 'groq_api_key' && !groqApiKey) groqApiKey = row.value;
          }
        }
      } catch {}
    }

    let extractedJson: any = null;
    let engineUsed: string | null = null;
    let geminiLastError: string | null = null;

    // ==========================================
    // 1. PRIMARY: Try Gemini AI Vision / Flash
    // ==========================================
    if (geminiApiKey) {
      const modelsToTry = [
        'gemini-flash-lite-latest',
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash',
        'gemini-3.8-flash',
      ];

      for (const model of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

          let requestBody: any;
          if (imageBase64) {
            const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9\+\-\.]+;base64,/, '');
            requestBody = {
              contents: [{
                parts: [
                  {
                    text: `You are an expert Telugu devotional literature scholar, Vedic Sanskrit expert, and high-accuracy OCR extractor.
Examine this devotional hymn/song sheet photo or screenshot carefully.
1. Extract the song title in authentic Telugu and Roman English.
2. Extract the complete Telugu lyrics with 100% spelling accuracy, correct Telugu ligatures (వత్తులు, దీర్ఘాలు, గుణింతాలు), and proper verse line breaks.
3. Transliterate into phonetic Roman English.
4. Provide a 2-3 sentence English meaning and spiritual significance.
5. Provide relevant tags and suggested deity slug (e.g. ayyappa-swamy, lord-shiva, lord-venkateswara, lord-hanuman, sri-rama, durga-devi, lord-ganesha, lord-krishna).

Respond STRICTLY in valid JSON with this exact schema:
{
  "titleTelugu": "తెలుగు శీర్షిక",
  "titleRoman": "Title in Roman English",
  "lyricsTelugu": "పూర్తి తెలుగు లిరిక్స్ (శ్రీ గురు చరణ...)",
  "lyricsRoman": "Complete Roman English lyrics (Shree Guru Charana...)",
  "meaning": "English devotional meaning and significance",
  "suggestedCategory": "ayyappa-swamy",
  "tags": "deity, stotram, bhajan, chalisa, sacred"
}`
                  },
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: cleanBase64,
                    }
                  }
                ]
              }],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json',
              }
            };
          } else if (rawText) {
            requestBody = {
              contents: [{
                parts: [{
                  text: `You are an expert Telugu devotional literature scholar and Vedic Sanskrit expert.
Review, correct, and format this raw devotional song text:
"${rawText}"

1. Correct any misspelled Telugu words, missing ottulu, incorrect vathulu, or OCR artifacts.
2. Ensure verse numbers and stanza breaks are crisp and traditional.
3. Transliterate into phonetic Roman English.
4. Provide a 2-3 sentence English meaning.
5. Suggest relevant deity slug and tags.

Respond STRICTLY in valid JSON:
{
  "titleTelugu": "తెలుగు శీర్షిక",
  "titleRoman": "Title in Roman English",
  "lyricsTelugu": "పూర్తి సరిదిద్దిన తెలుగు లిరిక్స్",
  "lyricsRoman": "Complete Roman English lyrics",
  "meaning": "English meaning",
  "suggestedCategory": "ayyappa-swamy",
  "tags": "deity, stotram, bhajan"
}`
                }]
              }],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json',
              }
            };
          }

          if (requestBody) {
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
            });

            if (response.ok) {
              const data: any = await response.json();
              const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (candidateText) {
                try {
                  extractedJson = JSON.parse(candidateText);
                  engineUsed = `Gemini AI (${model})`;
                  break;
                } catch {
                  const match = candidateText.match(/\{[\s\S]*\}/);
                  if (match) {
                    extractedJson = JSON.parse(match[0]);
                    engineUsed = `Gemini AI (${model})`;
                    break;
                  }
                }
              }
            } else {
              const errorText = await response.text();
              geminiLastError = `${model} HTTP ${response.status}: ${errorText.substring(0, 100)}`;
            }
          }
        } catch (err: any) {
          geminiLastError = `${model} Exception: ${err.message}`;
        }
      }
    }

    // ==========================================
    // 2. SECONDARY: Groq AI Fallback
    // ==========================================
    if (!extractedJson && groqApiKey) {
      const groqModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

      const promptText = rawText
        ? `You are an expert Telugu devotional literature scholar and Vedic Sanskrit expert.
Review, correct, and format this raw devotional song text:
"${rawText}"

1. Correct any misspelled Telugu words, missing ottulu, incorrect vathulu, or OCR artifacts.
2. Ensure verse numbers and stanza breaks are crisp and traditional.
3. Transliterate into phonetic Roman English.
4. Provide a 2-3 sentence English meaning.
5. Suggest relevant deity slug (e.g. ayyappa-swamy, lord-shiva, lord-venkateswara, lord-hanuman, sri-rama, durga-devi, lord-ganesha, lord-krishna) and tags.

Respond STRICTLY in valid JSON matching this schema:
{
  "titleTelugu": "తెలుగు శీర్షిక",
  "titleRoman": "Title in Roman English",
  "lyricsTelugu": "పూర్తి సరిదిద్దిన తెలుగు లిరిక్స్",
  "lyricsRoman": "Complete Roman English lyrics",
  "meaning": "English meaning",
  "suggestedCategory": "ayyappa-swamy",
  "tags": "deity, stotram, bhajan"
}`
        : `You are an expert Telugu devotional literature scholar. Provide a structured devotional stotram template in JSON format with titleTelugu, titleRoman, lyricsTelugu, lyricsRoman, meaning, suggestedCategory, tags.`;

      for (const gm of groqModels) {
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: gm,
              messages: [{ role: 'user', content: promptText }],
              response_format: { type: 'json_object' },
            }),
          });

          if (groqRes.ok) {
            const groqData: any = await groqRes.json();
            const content = groqData.choices?.[0]?.message?.content;
            if (content) {
              extractedJson = JSON.parse(content);
              engineUsed = `Groq AI (${gm})`;
              break;
            }
          }
        } catch {}
      }
    }

    if (!extractedJson) {
      return new Response(JSON.stringify({
        success: false,
        fallback: true,
        message: `Both Gemini and Groq AI unavailable. (Gemini: ${geminiLastError || 'No key'}). Standard local engine used.`,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const mapped = {
      title_telugu: extractedJson.titleTelugu || extractedJson.title_telugu || '',
      title_roman: extractedJson.titleRoman || extractedJson.title_roman || '',
      slug: (extractedJson.titleRoman || extractedJson.title_roman || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      lyrics_telugu: extractedJson.lyricsTelugu || extractedJson.lyrics_telugu || '',
      lyrics_roman: extractedJson.lyricsRoman || extractedJson.lyrics_roman || '',
      meaning_english: extractedJson.meaning || extractedJson.meaningEnglish || extractedJson.meaning_english || '',
      tags: extractedJson.tags || '',
      suggested_category: extractedJson.suggestedCategory || extractedJson.suggested_category || '',
    };

    return new Response(JSON.stringify({
      success: true,
      engine: engineUsed || 'AI Extractor',
      data: mapped,
      ...mapped,
      ...extractedJson,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
