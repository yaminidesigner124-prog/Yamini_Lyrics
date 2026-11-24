interface Env {
  GEMINI_API?: string;
  GEMINI_API_KEY?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const body: any = await context.request.json();
    const { imageBase64, mimeType = 'image/jpeg', rawText } = body;

    const apiKey = context.env.GEMINI_API || context.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({
        success: false,
        fallback: true,
        message: 'GEMINI_API key is not configured in Cloudflare environment.',
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-flash-latest',
    ];

    let geminiResponseText: string | null = null;
    let successfulModel: string | null = null;
    let lastError: string | null = null;

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        let requestBody: any;

        if (imageBase64) {
          const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
          requestBody = {
            contents: [{
              parts: [
                {
                  text: `You are an expert Telugu devotional literature scholar and high-accuracy OCR extractor.
Examine this devotional hymn/song sheet image.
1. Extract the song title in authentic Telugu and Roman English.
2. Extract the complete Telugu lyrics with 100% spelling accuracy.
3. Transliterate into Roman English.
4. Provide a 2-sentence English meaning.
5. Provide relevant tags and deity slug.

Respond STRICTLY in valid JSON matching this schema:
{
  "titleTelugu": "తెలుగు శీర్షిక",
  "titleRoman": "Title in Roman English",
  "lyricsTelugu": "పూర్తి తెలుగు లిరిక్స్",
  "lyricsRoman": "Complete Roman English lyrics",
  "meaning": "English devotional meaning",
  "suggestedCategory": "ayyappa-swamy / lord-shiva / lord-venkateswara / etc.",
  "tags": "comma, separated, tags"
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
                text: `You are an expert Telugu devotional literature scholar.
Process this raw devotional text:
"${rawText}"

Format strictly as JSON:
{
  "titleTelugu": "తెలుగు శీర్షిక",
  "titleRoman": "Title in Roman English",
  "lyricsTelugu": "పూర్తి సరిదిద్దిన తెలుగు లిరిక్స్",
  "lyricsRoman": "Complete Roman English lyrics",
  "meaning": "English meaning",
  "suggestedCategory": "category-slug",
  "tags": "comma, separated, tags"
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
          lastError = `${model} HTTP ${response.status}: ${errorText}`;
        }
      } catch (err: any) {
        lastError = `${model} Exception: ${err.message}`;
      }
    }

    if (!geminiResponseText) {
      return new Response(JSON.stringify({
        success: false,
        fallback: true,
        message: `Gemini API failed: ${lastError}`,
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

    return new Response(JSON.stringify({
      success: true,
      model: successfulModel,
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
