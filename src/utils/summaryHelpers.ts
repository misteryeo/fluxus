import type { PR } from "@/types";
import type { TemplateContext } from "@/lib/templateEngine";
import { buildContext } from "@/utils/buildContext";

export type SummaryDetailKey = "userValue" | "whatChanged" | "whyNow";

export interface SummaryDetails {
  userValue: string;
  whatChanged: string;
  whyNow: string;
}

export function buildFallbackSummary(prs: PR[]): string {
  if (prs.length === 0) {
    return "";
  }

  const titles = prs.map((pr) => ({
    number: pr.number,
    title: pr.title.trim().replace(/\.$/, ""),
  }));

  if (titles.length === 1) {
    const [single] = titles;
    return `Delivers ${single.title} (#${single.number}).`;
  }

  if (titles.length === 2) {
    return `Delivers ${titles[0].title} (#${titles[0].number}) and ${titles[1].title} (#${titles[1].number}).`;
  }

  const remainingCount = titles.length - 2;
  const remainingLabel = remainingCount === 1 ? "one additional update" : `${remainingCount} additional updates`;
  return `Delivers ${titles[0].title} (#${titles[0].number}), ${titles[1].title} (#${titles[1].number}), and ${remainingLabel}.`;
}

export function deriveSummaryDetails(context: TemplateContext): SummaryDetails {
  const sanitize = (value?: string | null): string => {
    if (typeof value !== "string") {
      return "";
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "";
  };

  const userValue = sanitize(context.userValue ?? context.summary ?? context.summaries?.value);
  const whatChanged = sanitize(context.whatChanged ?? context.compactPRList ?? context.summaries?.technical);
  const whyNow = sanitize(context.whyNow ?? context.impactLine);

  return {
    userValue,
    whatChanged,
    whyNow,
  };
}

export function createSummaryDetailsFromPRs(prs: PR[], summary: string): SummaryDetails {
  const context = buildContext({ prs, summary });
  return deriveSummaryDetails(context);
}
