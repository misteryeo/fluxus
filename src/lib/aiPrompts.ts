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

export interface ToneSettings {
  conciseDetailed: number;  // 0 = very concise, 100 = very detailed
  playfulFormal: number;    // 0 = very playful, 100 = very formal
  technicalLay: number;     // 0 = very technical, 100 = very lay/accessible
}

export interface SummaryPromptInput extends PromptInput {
  tone: ToneSettings;
  prDetails?: Array<{
    number: number;
    body?: string;
    files?: string[];
  }>;
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

// Helper functions for summary prompts with tone ------------------------------

function getToneGuidance(tone: ToneSettings): string {
  const guidance: string[] = [];

  // Concise vs Detailed
  if (tone.conciseDetailed < 30) {
    guidance.push("Be very concise - use short sentences and bullet points.");
  } else if (tone.conciseDetailed > 70) {
    guidance.push("Provide detailed explanations with context and examples.");
  } else {
    guidance.push("Balance brevity with necessary detail.");
  }

  // Playful vs Formal
  if (tone.playfulFormal < 30) {
    guidance.push("Use a casual, friendly tone - it's okay to be conversational.");
  } else if (tone.playfulFormal > 70) {
    guidance.push("Maintain a formal, professional tone throughout.");
  } else {
    guidance.push("Use a professional but approachable tone.");
  }

  // Technical vs Lay
  if (tone.technicalLay < 30) {
    guidance.push("Use technical terminology and implementation details freely.");
  } else if (tone.technicalLay > 70) {
    guidance.push("Avoid jargon - explain in plain language accessible to non-technical readers.");
  } else {
    guidance.push("Balance technical accuracy with accessibility.");
  }

  return guidance.join(" ");
}

function createSummaryPrompt({
  task,
  guidance,
  input,
}: {
  task: string;
  guidance?: string;
  input: SummaryPromptInput;
}): PromptMessage {
  const contextSnapshot = formatContextSnapshot(input.context, input.coreSummary);
  const prsSnapshot = formatPrSnapshot(input.prs);

  const userSections = [
    "=== Release Context (JSON) ===",
    JSON.stringify(contextSnapshot, null, 2),
    "",
    "=== Pull Requests (JSON) ===",
    JSON.stringify(prsSnapshot, null, 2),
  ];

  // Add PR details if available
  if (input.prDetails && input.prDetails.length > 0) {
    userSections.push("", "=== PR Details ===");
    input.prDetails.forEach((detail) => {
      userSections.push(`\nPR #${detail.number}:`);
      if (detail.body) {
        userSections.push(`Description: ${detail.body}`);
      }
      if (detail.files && detail.files.length > 0) {
        userSections.push(`Files changed: ${detail.files.join(", ")}`);
      }
    });
  }

  userSections.push("", "=== Task ===", task);

  const toneGuidance = getToneGuidance(input.tone);
  const allGuidance = [toneGuidance];
  if (guidance) {
    allGuidance.push(guidance);
  }

  userSections.push("", "=== Guidance ===", allGuidance.join(" "));

  return {
    system: "You are an assistant that writes crisp, factual release-note snippets. Always respond with a strict JSON object: {\"text\": string}. If the available information is insufficient or low-confidence, set text to \"Not enough information\". Keep tone professional and audience-appropriate.",
    user: userSections.join("\n"),
  };
}

// Summary field prompt builders -----------------------------------------------

export function getTechnicalSummaryPrompt(input: SummaryPromptInput): PromptMessage {
  return createSummaryPrompt({
    task: "Write a comprehensive technical summary of the changes in this release.",
    guidance: [
      "Include PR numbers, titles, and key technical changes from the code.",
      "Mention notable files changed, implementation approach, or architectural decisions when available.",
      "Reference specific components, APIs, or systems affected.",
      "If PR details are insufficient to write a meaningful summary, return \"Not enough information\".",
    ].join(" "),
    input,
  });
}

export function getUserFacingValuePrompt(input: SummaryPromptInput): PromptMessage {
  return createSummaryPrompt({
    task: "Explain the user-facing value of this release in 2-3 sentences.",
    guidance: [
      "Focus on the benefits and improvements users will experience.",
      "Answer: What problem does this solve? What can users now do?",
      "Avoid technical jargon unless the tone settings indicate a technical audience.",
      "If you cannot determine clear user value, return \"Not enough information\".",
    ].join(" "),
    input,
  });
}

export function getWhatChangedSummaryPrompt(input: SummaryPromptInput): PromptMessage {
  return createSummaryPrompt({
    task: "List what changed in this release as a concise summary or bullet points.",
    guidance: [
      "Focus on the specific features, fixes, or improvements delivered.",
      "Use bullet points (prefixed with '- ') if multiple distinct changes.",
      "Keep each point brief - this is meant to be scannable.",
      "If there's insufficient detail about changes, return \"Not enough information\".",
    ].join(" "),
    input,
  });
}

export function getWhyNowSummaryPrompt(input: SummaryPromptInput): PromptMessage {
  return createSummaryPrompt({
    task: "Explain why this release is being shipped now in 1-2 sentences.",
    guidance: [
      "Look for timing cues in PR labels, descriptions, or context.",
      "Consider: customer feedback, market timing, dependencies, or strategic priorities.",
      "This should provide business/product context, not just 'it was ready'.",
      "If timing rationale is unclear or absent, return \"Not enough information\".",
    ].join(" "),
    input,
  });
}

