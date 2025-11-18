import { NextResponse } from "next/server";
import { compile as renderTemplate, type TemplateContext } from "@/lib/templateEngine";
import { getDefaultTemplates as defaultTemplates } from "@/lib/defaultTemplates";
import { buildContext } from "@/utils/buildContext";
import type { PR } from "@/types";
import {
  getRisksFromSummaryPrompt,
  getWhyNowFromSummaryPrompt,
  getNextStepsFromSummaryPrompt,
  getKPIsFromSummaryPrompt,
  getNextMilestoneFromSummaryPrompt,
  getWhoGetsItFromSummaryPrompt,
  getHowToAccessFromSummaryPrompt,
  type SummaryToAudienceInput,
  type PromptMessage,
} from "@/lib/aiPrompts";

interface DraftRequest {
  contextInput?: {
    prs?: unknown;
    summaries?: {
      technical?: string;
      value?: string;
    };
  };
  coreSummary?: string;
  userFacingValue?: string;
  whatChanged?: string;
  whyNow?: string;
  tone?: unknown;
  audiences?: string[];
}

function normalizePullRequests(input: unknown): PR[] {
  if (Array.isArray(input)) {
    return input.filter(isValidPR);
  }
  if (input && typeof input === "object") {
    const values = Object.values(input as Record<string, unknown>);
    return values.filter(isValidPR);
  }
  return [];
}

function isValidPR(pr: unknown): pr is PR {
  if (!pr || typeof pr !== "object") {
    return false;
  }
  const candidate = pr as Record<string, unknown>;
  return (
    typeof candidate.number === "number" &&
    typeof candidate.title === "string" &&
    typeof candidate.repo === "string"
  );
}

export async function POST(req: Request) {
  try {
    console.log('====== [/api/drafts] POST HANDLER CALLED ======');
    const { contextInput, coreSummary, userFacingValue, whatChanged, whyNow, tone, audiences } = await req.json() as DraftRequest;
    const prs = normalizePullRequests(contextInput?.prs ?? []);

    console.log('[/api/drafts] Request received:', {
      prsCount: prs.length,
      hasCoreSummary: !!coreSummary,
      hasUserValue: !!userFacingValue,
      hasWhatChanged: !!whatChanged,
      hasWhyNow: !!whyNow,
      coreSummaryLength: coreSummary?.length || 0,
      userFacingValueLength: userFacingValue?.length || 0,
      whatChangedLength: whatChanged?.length || 0,
      whyNowLength: whyNow?.length || 0,
      coreSummaryPreview: coreSummary?.substring(0, 100),
      userFacingValuePreview: userFacingValue?.substring(0, 100),
    });

    // Build base context - pass userFacingValue as summary parameter since buildContext uses it for summaries.value
    const ctx = buildContext({
      prs: prs,
      summary: userFacingValue ?? "",
      tone
    });

    // Override with user-provided summary fields
    // buildContext auto-generates some fields, but we want to use the user's edited versions
    const enrichedCtx: TemplateContext = {
      ...ctx,
      summaries: {
        // Prefer user input, fall back to auto-generated, provide helpful default
        technical: coreSummary?.trim() || ctx.summaries.technical || ctx.compactPRList || "Release includes updates across multiple areas",
        value: userFacingValue?.trim() || ctx.summaries.value || ctx.userValue || "This release brings improvements and new capabilities",
      },
      // Provide meaningful defaults if user hasn't filled these in
      whatChanged: whatChanged?.trim() || ctx.whatChanged || ctx.compactPRList || "Multiple updates and improvements",
      whyNow: whyNow?.trim() || "Shipping improvements based on recent work",
    };

    const aiSections = await generateAISections({
      prs,
      coreSummary: coreSummary ?? "",
      userFacingValue: userFacingValue ?? "",
      whatChanged: whatChanged ?? "",
      whyNow: whyNow ?? "",
      context: enrichedCtx,
    });

    console.log('[/api/drafts] ===== AI SECTIONS RESULT =====', {
      risks: aiSections.risks ? `Generated (${aiSections.risks.length} chars): ${aiSections.risks.substring(0, 80)}...` : '❌ MISSING/UNDEFINED',
      whyNow: aiSections.whyNow ? `Generated (${aiSections.whyNow.length} chars): ${aiSections.whyNow.substring(0, 80)}...` : '❌ MISSING/UNDEFINED',
      nextSteps: aiSections.nextSteps ? `Generated (${aiSections.nextSteps.length} chars)` : '❌ MISSING/UNDEFINED',
      kpis: aiSections.kpis ? `Generated (${aiSections.kpis.length} chars)` : '❌ MISSING/UNDEFINED',
      nextMilestone: aiSections.nextMilestone ? `Generated (${aiSections.nextMilestone.length} chars)` : '❌ MISSING/UNDEFINED',
      whoGetsIt: aiSections.whoGetsIt ? `Generated (${aiSections.whoGetsIt.length} chars)` : '❌ MISSING/UNDEFINED',
      howToAccess: aiSections.howToAccess ? `Generated (${aiSections.howToAccess.length} chars)` : '❌ MISSING/UNDEFINED',
    });

    // Merge AI sections with fallback values to prevent [TBD] in templates
    const ctxWithAI: TemplateContext = {
      ...enrichedCtx,
      risks: aiSections.risks || "Standard deployment risks apply. Monitor system performance and user feedback closely.",
      whyNow: aiSections.whyNow || enrichedCtx.whyNow || "Shipping improvements based on recent work",
      nextSteps: aiSections.nextSteps || "Monitor release performance and gather user feedback for future iterations.",
      kpis: aiSections.kpis || "Track user adoption, system performance, and overall impact on key metrics.",
      nextMilestone: aiSections.nextMilestone || "Continue iterating based on user feedback and analytics.",
      whoGetsIt: aiSections.whoGetsIt || "This release is available to all users.",
      howToAccess: aiSections.howToAccess || "No additional steps required. Changes are live for all users.",
    };

    console.log('[/api/drafts] ===== CONTEXT WITH AI (ctxWithAI) =====');
    console.log('  risks:', ctxWithAI.risks?.substring(0, 100) || '❌ EMPTY');
    console.log('  whyNow:', ctxWithAI.whyNow?.substring(0, 100) || '❌ EMPTY');
    console.log('  nextSteps:', ctxWithAI.nextSteps?.substring(0, 100) || '❌ EMPTY');
    console.log('  summaries:', ctxWithAI.summaries);
    console.log('  summaries.technical:', ctxWithAI.summaries?.technical?.substring(0, 100) || '❌ EMPTY');
    console.log('  summaries.value:', ctxWithAI.summaries?.value?.substring(0, 100) || '❌ EMPTY');
    console.log('  typeof summaries:', typeof ctxWithAI.summaries);
    console.log('  summaries keys:', ctxWithAI.summaries ? Object.keys(ctxWithAI.summaries) : 'NO SUMMARIES');

    // TEST: Try simple templates to diagnose template engine issue
    console.log('[/api/drafts] ===== TEMPLATE ENGINE TEST =====');

    // Test with a plain object
    const plainObj = { foo: "bar", nested: { value: "hello" } };
    const test0 = renderTemplate("Plain object: {{ foo }} and {{ nested.value }}", plainObj);
    console.log('Test 0 - Plain object:', test0);

    // Test with the actual context
    const test1 = renderTemplate("Direct whyNow: {{ whyNow }}", ctxWithAI);
    console.log('Test 1 - Direct reference:', test1);

    // Test with a manually constructed object using same values
    const manualCtx = {
      whyNow: ctxWithAI.whyNow,
      risks: ctxWithAI.risks,
      summaries: ctxWithAI.summaries
    };
    const test5 = renderTemplate("Manual ctx: {{ whyNow }}", manualCtx);
    console.log('Test 5 - Manual context:', test5);

    // Test accessing the context directly
    console.log('Direct access test:', {
      'ctxWithAI.whyNow': ctxWithAI.whyNow,
      'typeof ctxWithAI': typeof ctxWithAI,
      'ctxWithAI constructor': ctxWithAI.constructor.name,
      'Object.keys(ctxWithAI).length': Object.keys(ctxWithAI).length
    });

    // Test resolvePath logic manually
    function testResolvePath(obj: Record<string, unknown>, path: string): unknown {
      console.log(`  testResolvePath(${path}):`, {
        pathSplit: path.split('.'),
        objKeys: Object.keys(obj),
        initialValue: obj
      });

      const result = path.split('.').reduce((current: unknown, key: string) => {
        console.log(`    reduce iteration: key="${key}", current type="${typeof current}", has key=${current && typeof current === 'object' ? key in (current as any) : 'N/A'}`);
        return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
      }, obj as unknown);

      console.log(`  testResolvePath result:`, result);
      return result;
    }

    console.log('[TEST resolvePath manually]:');
    testResolvePath(plainObj, 'foo');
    testResolvePath(ctxWithAI as any, 'whyNow');

    const target = audiences ?? ["internal", "customers", "changelog", "linkedin", "investor"];
    const templates = defaultTemplates();
    const drafts: Record<string, string> = {};

    for (const a of target) {
      // Map audience names to template keys
      const templateKey = a === "customers" ? "customer" : a === "changelog" || a === "linkedin" ? "public" : a;
      const template = templates[templateKey as keyof typeof templates];

      if (template) {
        console.log(`[/api/drafts] Compiling template for ${a} (using ${templateKey} template)`);
        console.log(`[/api/drafts] Template body preview:`, template.body.substring(0, 200));
        console.log(`[/api/drafts] Context keys:`, Object.keys(ctxWithAI));

        const rendered = renderTemplate(template.body, ctxWithAI);
        console.log(`[/api/drafts] Rendered ${a}: ${rendered.substring(0, 150)}...`);

        drafts[a] = rendered;
      }
    }

    console.log('[/api/drafts] Returning response with drafts:', {
      draftKeys: Object.keys(drafts),
      draftLengths: Object.fromEntries(Object.entries(drafts).map(([key, val]) => [key, val.length])),
      sampleContent: {
        internal: drafts.internal?.substring(0, 100) + '...',
        customers: drafts.customers?.substring(0, 100) + '...',
      }
    });

    return NextResponse.json({ drafts, context: ctxWithAI });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

type AISectionKey = "risks" | "whyNow" | "nextSteps" | "kpis" | "nextMilestone" | "whoGetsIt" | "howToAccess";

type AISections = Partial<Pick<TemplateContext, AISectionKey>>;

async function generateAISections(args: { prs: PR[]; coreSummary: string; userFacingValue: string; whatChanged: string; whyNow: string; context: TemplateContext }): Promise<AISections> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[generateAISections] OPENAI_API_KEY environment variable is not set!');
    return {};
  }

  console.log('[generateAISections] Starting AI generation for', Object.keys({
    risks: 1, whyNow: 1, nextSteps: 1, kpis: 1, nextMilestone: 1, whoGetsIt: 1, howToAccess: 1
  }).length, 'fields using summary-to-audience prompts');

  // Use the user-edited summary fields as primary input
  const summaryInput: SummaryToAudienceInput = {
    technicalSummary: args.coreSummary,
    userFacingValue: args.userFacingValue,
    whatChanged: args.whatChanged,
    whyNow: args.whyNow,
    prs: args.prs,  // Optional context for PR numbers/labels
  };

  console.log('[generateAISections] Summary input:', {
    technicalSummaryLength: summaryInput.technicalSummary.length,
    userFacingValueLength: summaryInput.userFacingValue.length,
    whatChangedLength: summaryInput.whatChanged.length,
    whyNowLength: summaryInput.whyNow.length,
    prCount: summaryInput.prs?.length || 0,
  });

  const promptMap: Record<AISectionKey, PromptMessage> = {
    risks: getRisksFromSummaryPrompt(summaryInput),
    whyNow: getWhyNowFromSummaryPrompt(summaryInput),
    nextSteps: getNextStepsFromSummaryPrompt(summaryInput),
    kpis: getKPIsFromSummaryPrompt(summaryInput),
    nextMilestone: getNextMilestoneFromSummaryPrompt(summaryInput),
    whoGetsIt: getWhoGetsItFromSummaryPrompt(summaryInput),
    howToAccess: getHowToAccessFromSummaryPrompt(summaryInput),
  };

  const entries = await Promise.all(
    Object.entries(promptMap).map(async ([key, prompt]) => {
      console.log(`[generateAISections] Generating ${key}...`);
      const text = await runOpenAICompletion(apiKey, prompt, key);
      const sanitized = sanitizeAIText(text);
      console.log(`[generateAISections] ${key} result:`, sanitized ? 'Success' : 'Failed/Empty');
      return [key, sanitized] as const;
    })
  );

  return Object.fromEntries(entries);
}

async function runOpenAICompletion(apiKey: string, prompt: PromptMessage, fieldName?: string): Promise<string | undefined> {
  const logPrefix = `[runOpenAICompletion${fieldName ? ' ' + fieldName : ''}]`;
  try {
    console.log(logPrefix, 'Calling OpenAI API...');
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(logPrefix, 'OpenAI API error:', { status: response.status, statusText: response.statusText, error: err.substring(0, 200) });
      return undefined;
    }

    console.log(logPrefix, 'OpenAI API call successful, parsing response...');
    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      console.error(logPrefix, 'No content in OpenAI response');
      return undefined;
    }

    try {
      const parsed = JSON.parse(content);
      const text = typeof parsed.text === "string" ? parsed.text.trim() : undefined;
      if (!text || text.length === 0) {
        console.warn(logPrefix, 'Empty text in parsed response');
        return undefined;
      }
      console.log(logPrefix, 'Successfully parsed:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
      return text;
    } catch (error) {
      console.error(logPrefix, 'JSON parse error:', error, 'content:', content.substring(0, 200));
      return undefined;
    }
  } catch (error) {
    console.error(logPrefix, 'Fetch error:', error);
    return undefined;
  }
}

function sanitizeAIText(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
