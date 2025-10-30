import { NextRequest, NextResponse } from 'next/server';
import { TemplateContext, compileWithDiagnostics } from '@/lib/templateEngine';
import { Audience } from '@/types/audience';

type AudienceDrafts = Record<Audience, {
  text: string;
  warnings?: string[];
  unknownTokens?: string[];
}>;

interface GenerateDraftsRequest {
  context: TemplateContext;
  templates: Record<Audience, { body: string; lengthLimit: number }>;
  locks?: Record<Audience, boolean>;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateDraftsRequest = await request.json();

    if (!body?.context || !body?.templates) {
      return NextResponse.json({ error: 'Invalid input: context and templates are required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing OPENAI_API_KEY server configuration' },
        { status: 500 }
      );
    }

    const audiences: Audience[] = ['internal', 'customer', 'investor', 'public'];
    const drafts: AudienceDrafts = {
      internal: { text: '' },
      customer: { text: '' },
      investor: { text: '' },
      public: { text: '' },
    } as AudienceDrafts;

    const systemBase = 'You draft clear, audience-appropriate release/update notes given context and a template. Follow the template structure, respect length limits, and keep placeholders resolved.';

    for (const audience of audiences) {
      if (body.locks?.[audience]) {
        // Skip locked audiences; return existing/empty text
        drafts[audience] = { text: '' };
        continue;
      }

      const template = body.templates[audience];
      if (!template) {
        drafts[audience] = { text: '' };
        continue;
      }

      // First, compile locally to resolve tokens for strong grounding
      const compiled = compileWithDiagnostics(template.body, body.context);
      let grounded = compiled.text;
      if (grounded.length > template.lengthLimit) {
        grounded = grounded.slice(0, template.lengthLimit - 3) + '...';
      }

      // Ask OpenAI to refine/polish the grounded draft for the audience
      const system = `${systemBase} Audience: ${audience}. Max length: ${template.lengthLimit} characters.`;
      const user = [
        'Context (JSON):',
        JSON.stringify(body.context, null, 2),
        '',
        'Template:',
        template.body,
        '',
        'Grounded draft (to refine, improve clarity/tone, keep content faithful):',
        grounded,
      ].join('\n');

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
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error(`OpenAI generate-drafts error (${audience}):`, err);
        // Fallback to grounded text if API fails
        drafts[audience] = {
          text: grounded,
          unknownTokens: compiled.unknownTokens.length ? compiled.unknownTokens : undefined,
        };
        continue;
      }

      const json = await response.json();
      let text: string = json.choices?.[0]?.message?.content?.toString() || grounded;
      if (text.length > template.lengthLimit) {
        text = text.slice(0, template.lengthLimit - 3) + '...';
      }

      drafts[audience] = {
        text,
        unknownTokens: compiled.unknownTokens.length ? compiled.unknownTokens : undefined,
      };
    }

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error('Generate drafts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


