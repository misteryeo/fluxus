import { NextRequest, NextResponse } from 'next/server';
import { compileWithDiagnostics, TemplateContext } from '@/lib/templateEngine';
import { Audience } from '@/types/audience';

interface GenerateRequest {
  audience: Audience;
  context: TemplateContext;
  template?: {
    body: string;
    lengthLimit?: number;
  };
}

interface GenerateResponse {
  text: string;
  warnings?: string[];
  unknownTokens?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();

    // Validate inputs
    if (!body.audience || !body.context) {
      return NextResponse.json(
        { error: 'Invalid input: audience and context are required' },
        { status: 400 }
      );
    }

    if (!['internal', 'customer', 'investor', 'public'].includes(body.audience)) {
      return NextResponse.json(
        { error: 'Invalid audience: must be internal, customer, investor, or public' },
        { status: 400 }
      );
    }

    // Use provided template or get default
    let templateBody: string;
    let lengthLimit: number;

    if (body.template?.body) {
      templateBody = body.template.body;
      lengthLimit = body.template.lengthLimit || 500; // Default fallback
    } else {
      // Import default templates dynamically to avoid circular imports
      const { getDefaultTemplates } = await import('@/lib/defaultTemplates');
      const defaultTemplates = getDefaultTemplates();
      const defaultTemplate = defaultTemplates[body.audience];
      templateBody = defaultTemplate.body;
      lengthLimit = defaultTemplate.lengthLimit;
    }

    // Compile the template with diagnostics
    const result = compileWithDiagnostics(templateBody, body.context);

    // Check for warnings (unknown tokens)
    const warnings: string[] = [];
    if (result.unknownTokens.length > 0) {
      warnings.push(...result.unknownTokens.map(token => `Unknown token: {{${token}}}`));
    }

    // Enforce length limit
    let finalText = result.text;
    if (finalText.length > lengthLimit) {
      finalText = finalText.slice(0, lengthLimit - 3) + '...';
    }

    const response: GenerateResponse = {
      text: finalText,
      warnings: warnings.length > 0 ? warnings : undefined,
      unknownTokens: result.unknownTokens.length > 0 ? result.unknownTokens : undefined
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
