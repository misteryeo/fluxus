import { NextResponse } from "next/server";
import { compile as renderTemplate, type TemplateContext } from "@/lib/templateEngine";
import { getDefaultTemplates as defaultTemplates } from "@/lib/defaultTemplates";
import { buildContext } from "@/utils/buildContext";
import type { PR } from "@/types";
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

interface DraftRequest {
  contextInput?: {
    prs?: unknown;
  };
  coreSummary?: string;
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
      const text = await runOpenAICompletion(apiKey, prompt);
      return [key, sanitizeAIText(text)] as const;
    })
  );

  return Object.fromEntries(entries);
}

async function runOpenAICompletion(apiKey: string, prompt: PromptMessage): Promise<string | undefined> {
  try {
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
      console.error("OpenAI aiSections error:", err);
      return undefined;
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(content);
      const text = typeof parsed.text === "string" ? parsed.text.trim() : undefined;
      return text && text.length > 0 ? text : undefined;
    } catch (error) {
      console.error("OpenAI aiSections parse error:", error);
      return undefined;
    }
  } catch (error) {
    console.error("OpenAI aiSections failure:", error);
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
