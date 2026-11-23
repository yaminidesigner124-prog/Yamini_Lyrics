import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType = 'image/jpeg', rawText } = body;

    const apiKey = process.env.GEMINI_API || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          fallback: true, 
          message: 'GEMINI_API key is not configured in .env. Falling back to local engine.' 
        },
        { status: 200 }
      );
    }

    // Models priority cascade: 3.8-flash -> 3.5-flash -> 2.5-flash-lite -> flash-latest
    const modelsToTry = [
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash-lite',
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
          // Vision Mode: Direct high-precision OCR & Translation from Image
          const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
          
          requestBody = {
            contents: [{
              parts: [
                {
                  text: `You are an expert Telugu devotional literature scholar and high-accuracy OCR extractor.
Examine this devotional hymn/song sheet image.
1. Extract the song title in authentic Telugu and Roman English.
2. Extract the complete Telugu lyrics with 100% spelling accuracy. Correct any optical artifacts, ligatures, or OCR errors (e.g. recognize 'అయ్యప్ప' correctly, never 'OOH'; 'ప్రీతి' correctly, never 'He'; 'శరణమయ్యప్పా' with double 'ప' ottu; 'కార్తీకమాసం' with proper 'ర్తీ' ottu; 'నిష్ఠతోనే' with 'ష్ఠ' ottu).
3. Retain exact verse numbering (1., 2., 3., etc.) and traditional refrain marks (॥...॥).
4. Provide a natural phonetic Roman English pronunciation / transliteration suitable for singing/chanting.
5. Provide a faithful, comprehensive verse-by-verse English spiritual meaning.
6. Suggest 4-6 relevant devotional tags.

Respond ONLY with a valid JSON object matching this schema:
{
  "title_telugu": "Original title in Telugu",
  "title_roman": "Phonetic Roman title",
  "slug": "kebab-case-url-slug",
  "lyrics_telugu": "Accurate, clean Telugu lyrics with verse numbers and refrain marks",
  "lyrics_roman": "Phonetic Roman English chanting transliteration",
  "meaning_english": "Comprehensive English spiritual meaning",
  "tags": "Comma-separated tags"
}`
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: cleanBase64
                  }
                }
              ]
            }],
            generationConfig: {
              response_mime_type: 'application/json'
            }
          };
        } else if (rawText) {
          // Text Correction Mode: Auto-fix spellings, ottus, ligatures, and format
          requestBody = {
            contents: [{
              parts: [
                {
                  text: `You are an expert Telugu devotional literature scholar.
Review and fix the following devotional song text.
Fix any OCR typos, missing ottus (ligatures), misspelled deity names (e.g. 'అయ్యప్ప', 'ప్రీతి', 'శరణమయ్యప్పా', 'కార్తీకమాసం', 'నిష్ఠతోనే', 'పదునెట్టాంబడి'), and structure into clean verses with proper refrain marks (॥...॥).
Also generate a phonetic Roman transliteration and an English spiritual meaning.

Text to fix:
${rawText}

Respond ONLY with a valid JSON object matching this schema:
{
  "title_telugu": "Corrected title in Telugu",
  "title_roman": "Phonetic Roman title",
  "slug": "kebab-case-url-slug",
  "lyrics_telugu": "Corrected and beautifully formatted Telugu lyrics",
  "lyrics_roman": "Phonetic Roman English chanting transliteration",
  "meaning_english": "Comprehensive English spiritual meaning",
  "tags": "Comma-separated tags"
}`
                }
              ]
            }],
            generationConfig: {
              response_mime_type: 'application/json'
            }
          };
        } else {
          return NextResponse.json(
            { error: 'Neither imageBase64 nor rawText provided' },
            { status: 400 }
          );
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        const data = await res.json();

        if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          geminiResponseText = data.candidates[0].content.parts[0].text;
          successfulModel = model;
          break; // Succeeded!
        } else {
          lastError = data.error?.message || `HTTP ${res.status}`;
          console.warn(`Model ${model} failed, trying next model:`, lastError);
        }
      } catch (err: any) {
        lastError = err.message;
        console.warn(`Exception on model ${model}:`, err.message);
      }
    }

    if (!geminiResponseText) {
      console.warn('All Gemini models exhausted. Falling back to local engine. Last error:', lastError);
      return NextResponse.json(
        { 
          success: false, 
          fallback: true, 
          message: `Gemini API unavailable (${lastError || 'timeout'}). Falling back to standard engine.` 
        },
        { status: 200 }
      );
    }

    // Parse extracted JSON from Gemini
    try {
      const parsed = JSON.parse(geminiResponseText);
      return NextResponse.json({
        success: true,
        fallback: false,
        engine: `Gemini AI (${successfulModel})`,
        data: {
          title_telugu: parsed.title_telugu || '',
          title_roman: parsed.title_roman || '',
          slug: parsed.slug || '',
          lyrics_telugu: parsed.lyrics_telugu || '',
          lyrics_roman: parsed.lyrics_roman || '',
          meaning_english: parsed.meaning_english || '',
          tags: parsed.tags || '',
        }
      });
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output:', geminiResponseText);
      return NextResponse.json(
        { 
          success: false, 
          fallback: true, 
          message: 'Could not parse AI response. Falling back to standard engine.' 
        },
        { status: 200 }
      );
    }
  } catch (err: any) {
    console.error('API /api/ai-extract error:', err);
    return NextResponse.json(
      { 
        success: false, 
        fallback: true, 
        message: err.message || 'Internal server error in AI extraction' 
      },
      { status: 200 }
    );
  }
}
