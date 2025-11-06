import { NextResponse } from "next/server";
import { compileWithDiagnostics, type TemplateContext } from "@/lib/templateEngine";
import { getDefaultTemplates } from "@/lib/defaultTemplates";
import type { Audience, PR } from "@/types";

type TemplateOverride = { body: string; lengthLimit?: number } | string;

interface DraftRequest {
  contextInput?: {
    prs?: unknown;
    meta?: TemplateContext["meta"];
    summaries?: Partial<TemplateContext["summaries"]>;
    links?: Partial<TemplateContext["links"]>;
    metrics?: Partial<TemplateContext["metrics"]>;
    notes?: string;
  };
  coreSummary?: string;
  tone?: unknown;
  audiences?: string[];
  templates?: Record<string, TemplateOverride>;
}

const DEFAULT_AUDIENCES: Audience[] = ["internal", "customer", "investor", "public"];

export async function POST(req: Request) {
  try {
    const body: DraftRequest = await req.json();
    const prs = normalizePullRequests(body.contextInput?.prs);
    const defaultTemplates = getDefaultTemplates();
    const templateOverrides = body.templates ?? {};

    const contextOverrides = extractContextOverrides(body.contextInput);
    const context = buildTemplateContext(prs, body.coreSummary, contextOverrides, body.tone);

    const audiences = determineAudiences(body.audiences, templateOverrides);
    const draftsEntries: Array<[string, string]> = [];

    for (const audienceKey of audiences) {
      const template = resolveTemplate(audienceKey, templateOverrides, defaultTemplates);
      if (!template) {
        continue;
      }

      const { text } = compileWithDiagnostics(template.body, context);
      let draftText = text.trim();

      const limit = template.lengthLimit;
      if (typeof limit === "number" && limit > 0 && draftText.length > limit) {
        draftText = draftText.slice(0, Math.max(0, limit - 3)).trimEnd() + "...";
      }

      draftsEntries.push([audienceKey, draftText]);
    }

    const drafts = Object.fromEntries(draftsEntries);

    return NextResponse.json({ drafts, context });
  } catch (error) {
    console.error("Drafts API error:", error);
    return NextResponse.json({ error: "Failed to generate drafts" }, { status: 500 });
  }
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

function extractContextOverrides(
  contextInput?: DraftRequest["contextInput"]
): Partial<TemplateContext> | undefined {
  if (!contextInput) {
    return undefined;
  }

  const overrides: Partial<TemplateContext> = {};
  let hasOverrides = false;

  if (contextInput.meta && typeof contextInput.meta === "object") {
    overrides.meta = contextInput.meta as TemplateContext["meta"];
    hasOverrides = true;
  }

  if (contextInput.summaries && typeof contextInput.summaries === "object") {
    overrides.summaries = contextInput.summaries as TemplateContext["summaries"];
    hasOverrides = true;
  }

  if (contextInput.links && typeof contextInput.links === "object") {
    overrides.links = contextInput.links as TemplateContext["links"];
    hasOverrides = true;
  }

  if (contextInput.metrics && typeof contextInput.metrics === "object") {
    overrides.metrics = contextInput.metrics as TemplateContext["metrics"];
    hasOverrides = true;
  }

  if (typeof contextInput.notes === "string") {
    overrides.notes = contextInput.notes;
    hasOverrides = true;
  }

  return hasOverrides ? overrides : undefined;
}

function buildTemplateContext(
  prs: PR[],
  coreSummary?: string,
  overrides?: Partial<TemplateContext>,
  tone?: unknown
): TemplateContext {
  const baseContext = createBaseContext(prs, coreSummary, tone);
  return mergeContexts(baseContext, overrides);
}

function createBaseContext(prs: PR[], coreSummary?: string, tone?: unknown): TemplateContext {
  const mainSummary = typeof coreSummary === "string" ? coreSummary.trim() : "";
  const technicalSummary = buildTechnicalSummary(prs);
  const meta = buildMeta(prs);
  const links = buildLinks(prs);
  const notes = buildNotes(prs, tone);

  return {
    meta,
    summaries: {
      technical: technicalSummary,
      value: mainSummary,
    },
    links,
    metrics: {
      kpi: undefined,
    },
    notes,
  };
}

function mergeContexts(base: TemplateContext, overrides?: Partial<TemplateContext>): TemplateContext {
  if (!overrides) {
    return base;
  }

  return {
    meta: { ...base.meta, ...overrides.meta },
    summaries: { ...base.summaries, ...overrides.summaries },
    links: { ...base.links, ...overrides.links },
    metrics: { ...base.metrics, ...overrides.metrics },
    notes: overrides.notes ?? base.notes,
  };
}

function determineAudiences(
  requested?: string[],
  templateOverrides?: Record<string, TemplateOverride>
): string[] {
  if (Array.isArray(requested) && requested.length > 0) {
    return Array.from(new Set(requested.filter((audience) => typeof audience === "string")));
  }

  const overrideAudiences = templateOverrides ? Object.keys(templateOverrides) : [];
  return Array.from(new Set([...DEFAULT_AUDIENCES, ...overrideAudiences]));
}

function resolveTemplate(
  audience: string,
  overrides: Record<string, TemplateOverride> | undefined,
  defaultTemplates: ReturnType<typeof getDefaultTemplates>
): { body: string; lengthLimit?: number } | undefined {
  const override = overrides?.[audience];
  let defaultTemplate: ReturnType<typeof getDefaultTemplates>[Audience] | undefined;

  if (isKnownAudience(audience)) {
    defaultTemplate = defaultTemplates[audience];
  }

  if (override) {
    if (typeof override === "string") {
      return {
        body: override,
        lengthLimit: defaultTemplate?.lengthLimit,
      };
    }

    if (typeof override === "object" && typeof override.body === "string") {
      return {
        body: override.body,
        lengthLimit: typeof override.lengthLimit === "number" ? override.lengthLimit : defaultTemplate?.lengthLimit,
      };
    }
  }

  if (defaultTemplate) {
    return {
      body: defaultTemplate.body,
      lengthLimit: defaultTemplate.lengthLimit,
    };
  }

  return undefined;
}

function isKnownAudience(value: string): value is Audience {
  return (DEFAULT_AUDIENCES as string[]).includes(value);
}

function buildTechnicalSummary(prs: PR[]): string {
  if (!prs.length) {
    return "[TBD]";
  }

  const lines = prs.map((pr) => `- #${pr.number}: ${pr.title}`);
  return lines.join("\n");
}

function buildMeta(prs: PR[]): TemplateContext["meta"] {
  const labels = collectLabels(prs);

  const featureName = deriveFeatureName(prs);
  const productArea = extractProductAreas(labels);
  const status = deriveStatus(labels);
  const access = deriveAccess(labels);

  return {
    featureName,
    status,
    access,
    audienceNotes: undefined,
    productArea: productArea.length > 0 ? productArea : undefined,
    version: undefined,
  };
}

function buildLinks(prs: PR[]): TemplateContext["links"] {
  const urls = prs
    .map((pr) => buildPRUrl(pr))
    .filter((url): url is string => Boolean(url));

  let prUrl: string | undefined;

  if (urls.length === 1) {
    prUrl = urls[0];
  } else if (urls.length > 1) {
    prUrl = urls
      .map((url, index) => {
        const pr = prs[index];
        return `#${pr.number} (${pr.repo}): ${url}`;
      })
      .join("\n");
  }

  return {
    prUrl,
    linearUrl: undefined,
    docsUrl: undefined,
  };
}

function buildNotes(prs: PR[], tone: unknown): string {
  const parts: string[] = [];

  if (prs.length > 0) {
    for (const pr of prs) {
      const author = typeof pr.author?.name === "string" ? pr.author.name : "unknown author";
      const repo = pr.repo;
      const risk = pr.riskLevel ? ` | risk: ${pr.riskLevel}` : "";
      parts.push(`#${pr.number} — ${pr.title} (${repo}) by ${author}${risk}`);
    }
  }

  const toneDescription = describeTone(tone);
  if (toneDescription) {
    parts.push(`Preferred tone: ${toneDescription}`);
  }

  return parts.join("\n");
}

function describeTone(tone: unknown): string | undefined {
  if (!tone || typeof tone !== "object") {
    return undefined;
  }

  const entries = Object.entries(tone as Record<string, unknown>).filter(([, value]) => {
    return typeof value === "string" || typeof value === "number";
  });

  if (entries.length === 0) {
    return undefined;
  }

  return entries.map(([key, value]) => `${key}: ${value}`).join(", ");
}

function collectLabels(prs: PR[]): string[] {
  const labels = prs.flatMap((pr) => Array.isArray(pr.labels) ? pr.labels : []);
  return Array.from(new Set(labels.map((label) => label.toLowerCase())));
}

function extractProductAreas(labels: string[]): string[] {
  const productLabels = labels
    .map((label) => {
      if (label.startsWith("area:")) {
        return label.replace("area:", "").trim();
      }
      if (label.startsWith("product:")) {
        return label.replace("product:", "").trim();
      }
      return undefined;
    })
    .filter((label): label is string => Boolean(label));

  return Array.from(new Set(productLabels));
}

function deriveStatus(labels: string[]): TemplateContext["meta"]["status"] | undefined {
  const normalized = labels.map((label) => label.toLowerCase());

  if (normalized.some((label) => label.includes("experimental") || label.includes("alpha") || label.includes("flagged"))) {
    return "flagged";
  }

  if (normalized.some((label) => label.includes("beta"))) {
    return "beta";
  }

  if (normalized.some((label) => label.includes("ga") || label.includes("general availability"))) {
    return "ga";
  }

  if (normalized.some((label) => label.includes("tbd"))) {
    return "tbd";
  }

  return undefined;
}

function deriveAccess(labels: string[]): string | undefined {
  const normalized = labels.map((label) => label.toLowerCase());

  if (normalized.some((label) => label.includes("internal"))) {
    return "internal only";
  }

  if (normalized.some((label) => label.includes("private"))) {
    return "private preview";
  }

  if (normalized.some((label) => label.includes("public"))) {
    return "public";
  }

  if (normalized.some((label) => label.includes("beta"))) {
    return "beta rollout";
  }

  return undefined;
}

function deriveFeatureName(prs: PR[]): string | undefined {
  if (prs.length === 0) {
    return undefined;
  }

  const titles = prs.map((pr) => pr.title?.trim()).filter((title): title is string => Boolean(title));
  if (titles.length === 0) {
    return undefined;
  }

  if (titles.length === 1) {
    return titles[0];
  }

  const preview = titles.slice(0, 2).join(" • ");
  const remainder = titles.length - 2;
  return remainder > 0 ? `${preview} (+${remainder} more)` : preview;
}

function buildPRUrl(pr: PR): string | undefined {
  if (!pr.repo || typeof pr.repo !== "string" || typeof pr.number !== "number") {
    return undefined;
  }

  const repoSlug = pr.repo.replace(/^https:\/\/github.com\//, "");
  if (!repoSlug.includes("/")) {
    return undefined;
  }

  return `https://github.com/${repoSlug}/pull/${pr.number}`;
}
