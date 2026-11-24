interface Env {
  GEMINI_API?: string;
  GEMINI_API_KEY?: string;
  DB?: any;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const body: any = await context.request.json().catch(() => ({}));
    const { imageBase64, mimeType = 'image/jpeg', rawText } = body;

    let apiKey = context.env.GEMINI_API || context.env.GEMINI_API_KEY;

    // Check Cloudflare D1 settings table if not in environment
    if (!apiKey && context.env.DB) {
      try {
        const row: any = await context.env.DB.prepare("SELECT value FROM settings WHERE key = 'gemini_api_key'").first();
        if (row?.value) {
          apiKey = row.value;
        }
      } catch {}
    }

    if (!apiKey) {
      return new Response(JSON.stringify({
        success: false,
        fallback: true,
        message: 'Gemini API key is not configured. Please save it in Admin Studio settings.',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Proven high-availability Gemini models supporting vision & structured JSON
    const modelsToTry = [
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.8-flash',
    ];

    let geminiResponseText: string | null = null;
    let successfulModel: string | null = null;
    let lastError: string | null = null;

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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
        } else {
          return new Response(JSON.stringify({ error: 'No image or text provided' }), { status: 400 });
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data: any = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            geminiResponseText = candidateText;
            successfulModel = model;
            break;
          }
        } else {
          const errorText = await response.text();
          lastError = `${model} HTTP ${response.status}: ${errorText.substring(0, 150)}`;
        }
      } catch (err: any) {
        lastError = `${model} Exception: ${err.message}`;
      }
    }

    if (!geminiResponseText) {
      return new Response(JSON.stringify({
        success: false,
        fallback: true,
        message: `Gemini AI service unavailable: ${lastError}`,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(geminiResponseText);
    } catch {
      const match = geminiResponseText.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    if (!parsed) {
      return new Response(JSON.stringify({
        success: false,
        fallback: true,
        message: 'Could not parse Gemini JSON response.',
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    const mapped = {
      title_telugu: parsed.titleTelugu || parsed.title_telugu || '',
      title_roman: parsed.titleRoman || parsed.title_roman || '',
      slug: (parsed.titleRoman || parsed.title_roman || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      lyrics_telugu: parsed.lyricsTelugu || parsed.lyrics_telugu || '',
      lyrics_roman: parsed.lyricsRoman || parsed.lyrics_roman || '',
      meaning_english: parsed.meaning || parsed.meaningEnglish || parsed.meaning_english || '',
      tags: parsed.tags || '',
      suggested_category: parsed.suggestedCategory || parsed.suggested_category || '',
    };

    return new Response(JSON.stringify({
      success: true,
      engine: `Gemini AI (${successfulModel})`,
      model: successfulModel,
      data: mapped,
      ...mapped,
      ...parsed,
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
