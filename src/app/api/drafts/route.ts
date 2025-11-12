import { NextResponse } from "next/server";
import { compile as renderTemplate, type TemplateContext } from "@/lib/templateEngine";
import { getDefaultTemplates as defaultTemplates } from "@/lib/defaultTemplates";
import { buildContext } from "@/utils/buildContext";
import type { PR } from "@/types";
import { normalizePullRequests } from "@/utils/prs";
import {
  getRisksPrompt,
  getWhyNowPrompt,
  getNextStepsPrompt,
  getKPIsPrompt,
  getNextMilestonePrompt,
  getWhoGetsItPrompt,
  getHowToAccessPrompt,
  type PromptInput,
  type PromptMessage,
} from "@/lib/aiPrompts";
import { requestPromptCompletion, sanitizeAIText } from "@/lib/aiClient";

interface DraftRequest {
  contextInput?: {
    prs?: unknown;
  };
  coreSummary?: string;
  tone?: unknown;
  audiences?: string[];
}

export async function POST(req: Request) {
  try {
    const { contextInput, coreSummary, tone, audiences } = await req.json() as DraftRequest;
    const prs = normalizePullRequests(contextInput?.prs ?? []);
    
    const ctx = buildContext({ 
      prs: prs, 
      summary: coreSummary ?? "", 
      tone 
    });

    const aiSections = await generateAISections({
      prs,
      coreSummary: coreSummary ?? "",
      context: ctx,
    });

    const ctxWithAI: TemplateContext = {
      ...ctx,
      ...aiSections,
    };

    const target = audiences ?? ["internal", "customers", "changelog", "linkedin", "email", "investor"];
    const templates = defaultTemplates();
    const drafts: Record<string, string> = {};

    for (const a of target) {
      // Map audience names to template keys
      const templateKey = a === "customers" ? "customer" : a === "changelog" || a === "linkedin" || a === "email" ? "public" : a;
      const template = templates[templateKey as keyof typeof templates];
      
      if (template) {
        drafts[a] = renderTemplate(template.body, ctxWithAI);
      }
    }

    return NextResponse.json({ drafts, context: ctxWithAI });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

type AISectionKey = "risks" | "whyNow" | "nextSteps" | "kpis" | "nextMilestone" | "whoGetsIt" | "howToAccess";

type AISections = Partial<Pick<TemplateContext, AISectionKey>>;

async function generateAISections(args: { prs: PR[]; coreSummary: string; context: TemplateContext }): Promise<AISections> {
  if (args.prs.length === 0) {
    return {};
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {};
  }

  const promptInput: PromptInput = {
    prs: args.prs,
    context: args.context,
    coreSummary: args.coreSummary,
  };

  const promptMap: Record<AISectionKey, PromptMessage> = {
    risks: getRisksPrompt(promptInput),
    whyNow: getWhyNowPrompt(promptInput),
    nextSteps: getNextStepsPrompt(promptInput),
    kpis: getKPIsPrompt(promptInput),
    nextMilestone: getNextMilestonePrompt(promptInput),
    whoGetsIt: getWhoGetsItPrompt(promptInput),
    howToAccess: getHowToAccessPrompt(promptInput),
  };

  const entries = await Promise.all(
    Object.entries(promptMap).map(async ([key, prompt]) => {
      const result = await requestPromptCompletion(prompt);

      if (result.error) {
        console.error("OpenAI aiSections error:", result.error);
      }

      return [key, sanitizeAIText(result.text)] as const;
    })
  );

  return Object.fromEntries(entries);
}
