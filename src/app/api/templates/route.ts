import { NextResponse } from 'next/server';
import {
  loadCustomTemplates,
  saveCustomTemplate,
  resetTemplate,
  getEffectiveTemplates,
  isTemplateCustomized,
} from '@/lib/templateStorage';
import type { Audience } from '@/types/audience';

const VALID_AUDIENCES: Audience[] = ['internal', 'customer', 'investor', 'public'];

function isValidAudience(audience: string): audience is Audience {
  return VALID_AUDIENCES.includes(audience as Audience);
}

/**
 * GET /api/templates
 * Returns all effective templates (custom merged with defaults)
 */
export async function GET() {
  try {
    const templates = await getEffectiveTemplates();

    // Also include customization status for each audience
    const customizationStatus: Record<string, boolean> = {};
    for (const audience of VALID_AUDIENCES) {
      customizationStatus[audience] = await isTemplateCustomized(audience);
    }

    return NextResponse.json({
      templates,
      customized: customizationStatus,
    });
  } catch (error) {
    console.error('[GET /api/templates] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates
 * Save or reset a template
 *
 * Body: {
 *   action: 'save' | 'reset',
 *   audience: Audience,
 *   body?: string (required for 'save')
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, audience, body: templateBody } = body;

    // Validate action
    if (!action || !['save', 'reset'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "save" or "reset"' },
        { status: 400 }
      );
    }

    // Validate audience
    if (!audience || !isValidAudience(audience)) {
      return NextResponse.json(
        { error: `Invalid audience. Must be one of: ${VALID_AUDIENCES.join(', ')}` },
        { status: 400 }
      );
    }

    if (action === 'save') {
      // Validate template body
      if (!templateBody || typeof templateBody !== 'string') {
        return NextResponse.json(
          { error: 'Template body is required and must be a string' },
          { status: 400 }
        );
      }

      // Basic validation: check for balanced {{ }} tokens
      const openBraces = (templateBody.match(/\{\{/g) || []).length;
      const closeBraces = (templateBody.match(/\}\}/g) || []).length;
      if (openBraces !== closeBraces) {
        return NextResponse.json(
          { error: 'Template has unbalanced {{ }} tokens' },
          { status: 400 }
        );
      }

      await saveCustomTemplate(audience, templateBody);

      return NextResponse.json({
        success: true,
        message: `Template saved for ${audience}`,
      });
    } else if (action === 'reset') {
      await resetTemplate(audience);

      return NextResponse.json({
        success: true,
        message: `Template reset to default for ${audience}`,
      });
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[POST /api/templates] Error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update template' },
      { status: 500 }
    );
  }
}
