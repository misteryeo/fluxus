import type { PR } from "@/types";
import type { TemplateContext } from "@/lib/templateEngine";

export interface PromptMessage {
  system: string;
  user: string;
}

export interface PromptInput {
  prs: PR[];
  context: TemplateContext;
  coreSummary: string;
}

const BASE_SYSTEM = [
  "You are an assistant that writes crisp, factual release-note snippets.",
  "Always respond with a strict JSON object: {\"text\": string}.",
  "If the available information is insufficient or low-confidence, set text to \"[Needs to be filled in]\".",
  "Keep tone professional and audience-appropriate.",
].join(" ");

function formatPrSnapshot(prs: PR[]): unknown {
  return prs.map((pr) => ({
    number: pr.number,
    title: pr.title,
    repo: pr.repo,
    mergedDate: pr.mergedDate,
    labels: pr.labels,
    riskLevel: pr.riskLevel,
    author: pr.author?.name,
  }));
}

function formatContextSnapshot(context: TemplateContext, coreSummary: string): unknown {
  return {
    coreSummary,
    summaries: context.summaries,
    meta: context.meta,
    metrics: context.metrics,
    notes: context.notes,
  };
}

function createPrompt({
  task,
  guidance,
  input,
}: {
  task: string;
  guidance?: string;
  input: PromptInput;
}): PromptMessage {
  const contextSnapshot = formatContextSnapshot(input.context, input.coreSummary);
  const prsSnapshot = formatPrSnapshot(input.prs);

  const userSections = [
    "=== Release Context (JSON) ===",
    JSON.stringify(contextSnapshot, null, 2),
    "",
    "=== Pull Requests (JSON) ===",
    JSON.stringify(prsSnapshot, null, 2),
    "",
    "=== Task ===",
    task,
  ];

  if (guidance) {
    userSections.push("", "=== Guidance ===", guidance);
  }

  return {
    system: BASE_SYSTEM,
    user: userSections.join("\n"),
  };
}

// Individual prompt builders -------------------------------------------------

export function getRisksPrompt(input: PromptInput): PromptMessage {
  return createPrompt({
    task: "Summarize the top 1-3 risks or limitations for this release.",
    guidance: [
      "Use signals such as PR labels (e.g. security, breaking-change), riskLevel, and meta.status (beta, flagged).",
      "If the context is silent on risks, return \"[Needs to be filled in]\".",
      "Prefer bullet points prefixed with '- '.",
    ].join(" "),
    input,
  });
}

export function getWhyNowPrompt(input: PromptInput): PromptMessage {
  return createPrompt({
    task: "Explain why this release matters right now in 1-2 sentences.",
    guidance: [
      "Anchor to recent changes, user impact, or timing called out by PRs or summaries.",
      "If you cannot find a compelling reason, return \"[Needs to be filled in]\".",
    ].join(" "),
    input,
  });
}

export function getNextStepsPrompt(input: PromptInput): PromptMessage {
  return createPrompt({
    task: "List 1-3 concrete next steps for the team or stakeholders.",
    guidance: [
      "Consider meta.status (beta, flagged, ga) and any follow-up hinted by PR notes.",
      "Outputs should be bullet points prefixed with '- '.",
      "If unsure, return \"[Needs to be filled in]\".",
    ].join(" "),
    input,
  });
}

export function getKPIsPrompt(input: PromptInput): PromptMessage {
  return createPrompt({
    task: "Provide key KPIs or leading indicators that reflect impact.",
    guidance: [
      "Use metrics.kpi if populated, otherwise infer from summaries.value or notes.",
      "If nothing trustworthy exists, return \"[Needs to be filled in]\".",
    ].join(" "),
    input,
  });
}

export function getNextMilestonePrompt(input: PromptInput): PromptMessage {
  return createPrompt({
    task: "State the next milestone or checkpoint for this work.",
    guidance: [
      "Leverage meta.status and PR cues (e.g., upcoming GA, wider rollout).",
      "Keep it to a short phrase or sentence.",
      "Return \"[Needs to be filled in]\" if there is no signal.",
    ].join(" "),
    input,
  });
}

export function getWhoGetsItPrompt(input: PromptInput): PromptMessage {
  return createPrompt({
    task: "Describe who gains access in this release (e.g., Beta customers, All users).",
    guidance: [
      "Prefer meta.audienceNotes or meta.access. If access is public, say so explicitly.",
      "If unclear, return \"[Needs to be filled in]\".",
    ].join(" "),
    input,
  });
}

export function getHowToAccessPrompt(input: PromptInput): PromptMessage {
  return createPrompt({
    task: "Explain briefly how users can access or enable the feature.",
    guidance: [
      "Use meta.access, notes, or PR descriptions for activation steps.",
      "If that information is missing, return \"[Needs to be filled in]\".",
    ].join(" "),
    input,
  });
}

