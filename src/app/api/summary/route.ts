import { NextResponse } from "next/server";
import { buildContext } from "@/utils/buildContext";
import { normalizePullRequests } from "@/utils/prs";
import { getCoreSummaryPrompt, type PromptInput } from "@/lib/aiPrompts";
import { requestPromptCompletion, sanitizeAIText } from "@/lib/aiClient";
import { buildFallbackSummary, deriveSummaryDetails } from "@/utils/summaryHelpers";

interface SummaryRequest {
  prs?: unknown;
  coreSummary?: string;
  tone?: unknown;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SummaryRequest;
    const prs = normalizePullRequests(body.prs ?? []);

    if (prs.length === 0) {
      return NextResponse.json({ summary: null, error: "No pull requests provided" }, { status: 400 });
    }

    const baseContext = buildContext({
      prs,
      summary: body.coreSummary ?? "",
      tone: body.tone,
    });

    const promptInput: PromptInput = {
      prs,
      context: baseContext,
      coreSummary: body.coreSummary ?? "",
    };

    const prompt = getCoreSummaryPrompt(promptInput);
    const result = await requestPromptCompletion(prompt);

    const fallbackSummary = buildFallbackSummary(prs);
    const aiSummary = sanitizeAIText(result.text);
    const summary = aiSummary ?? fallbackSummary;

    const contextWithSummary = buildContext({
      prs,
      summary,
      tone: body.tone,
    });

    const details = deriveSummaryDetails(contextWithSummary);

    return NextResponse.json({
      summary,
      summarySource: aiSummary ? "ai" : "fallback",
      details,
      error: result.error ?? (aiSummary ? null : "AI summary returned no content"),
    });
  } catch (error) {
    console.error("Summary generation failure:", error);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
