import { NextRequest, NextResponse } from 'next/server';

interface SummarizeRequest {
  prText: string;
  ticketText: string;
}

interface SummarizeResponse {
  technical: string;
  value: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SummarizeRequest = await request.json();

    if (typeof body.prText !== 'string' || typeof body.ticketText !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input: prText and ticketText must be strings' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing OPENAI_API_KEY server configuration' },
        { status: 500 }
      );
    }

    const system = [
      'You are an assistant that produces concise, structured summaries for engineering updates.',
      'Respond ONLY with a strict JSON object. Fields must be STRINGS, not arrays or nested objects.',
      'Fields: "technical" = 1-3 bullet points separated by newlines, each prefixed with "- ", summarizing what changed with concrete details; "value" = <=280 chars, specific impact, no platitudes.',
      'Only use details present in the user content. If insufficient info, use "[TBD]".'
    ].join(' ');

    const user = `PR/Change Notes:\n${body.prText}\n\nTicket / Problem Context:\n${body.ticketText}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI summarize error:', err);
      return NextResponse.json({ error: 'Failed to summarize' }, { status: 502 });
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content || '{}';
    let parsed: Partial<SummarizeResponse> = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

    const normalizeText = (input: unknown): string => {
      if (Array.isArray(input)) {
        return input.filter(Boolean).map(item => `- ${String(item)}`).join('\n');
      }
      if (input && typeof input === 'object') {
        const obj = input as Record<string, unknown>;
        if (Array.isArray(obj.bullets)) {
          return obj.bullets.filter(Boolean).map(item => `- ${String(item)}`).join('\n');
        }
        if (typeof obj.text === 'string') {
          return obj.text as string;
        }
        // Fallback: join primitive values
        const values = Object.values(obj).filter(v => typeof v !== 'object');
        if (values.length > 0) return values.map(v => String(v)).join(' ');
        return '[TBD]';
      }
      return String(input || '').trim();
    };

    const technical = normalizeText(parsed.technical).trim() || '[TBD]';
    let value = normalizeText(parsed.value).trim() || '[TBD]';
    if (value.length > 280) value = value.slice(0, 277) + '...';

    return NextResponse.json({ technical, value } satisfies SummarizeResponse);

  } catch (error) {
    console.error('Summarize API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
