import { useEffect, useState, useCallback } from "react";

import type { PR } from "@/types";
import type { TemplateContext } from "@/lib/templateEngine";

export interface Repo {
  fullName: string;
  name: string;
  private: boolean;
  description: string | null;
  updatedAt: string;
  defaultBranch: string;
}

export function useRepos(owner: string) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const refresh = useCallback(async (nextOwner?: string) => {
    const targetOwner = typeof nextOwner === "string" ? nextOwner : owner;
    if (!targetOwner) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/repos?owner=${encodeURIComponent(targetOwner)}`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) {
        const errorMessage = d.error || `Failed to load repositories: ${res.status}`;
        throw new Error(errorMessage);
      }
      const reposData = Array.isArray(d.repos) ? (d.repos as Repo[]) : [];
      setRepos(reposData);
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setRepos([]);
    } finally {
      setLoading(false);
    }
  }, [owner]);

  useEffect(() => {
    refresh();
  }, [refresh]);
  
  return { repos, loading, error, refresh };
}

export function usePRs(repo: string = "misteryeo/fluxus") {
  const [prs, setPRs] = useState<PR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async (nextRepo?: string) => {
    const targetRepo = typeof nextRepo === "string" ? nextRepo : repo;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/prs?repo=${encodeURIComponent(targetRepo)}`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) {
        const errorMessage = d.error || `Failed to load pull requests: ${res.status}`;
        throw new Error(errorMessage);
      }
      const prsData = Array.isArray(d.prs) ? (d.prs as PR[]) : [];
      setPRs(prsData);
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setPRs([]);
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    refresh();
  }, [refresh]);
  return { prs, loading, error, refresh };
}

type DraftTemplateOverride = { body: string; lengthLimit?: number } | string;

type DraftContextInput = {
  prs?: Partial<PR>[];
  meta?: TemplateContext["meta"];
  summaries?: Partial<TemplateContext["summaries"]>;
  links?: Partial<TemplateContext["links"]>;
  metrics?: Partial<TemplateContext["metrics"]>;
  notes?: string;
};

export interface DraftRegenerateArgs {
  contextInput?: DraftContextInput;
  coreSummary?: string;
  userFacingValue?: string;
  whatChanged?: string;
  whyNow?: string;
  tone?: Record<string, unknown>;
  audiences?: string[];
  templates?: Record<string, DraftTemplateOverride>;
}

interface DraftsResponse {
  drafts?: Record<string, string>;
  context?: TemplateContext;
}

function mapDraftsForUI(drafts: Record<string, string>): Record<string, string> {
  const normalized = { ...drafts };

  if (drafts.customer && !normalized.customers) {
    normalized.customers = drafts.customer;
  }

  if (drafts.investor && !normalized.investors) {
    normalized.investors = drafts.investor;
  }

  if (drafts.public) {
    if (!normalized.changelog) {
      normalized.changelog = drafts.public;
    }
    if (!normalized.linkedin) {
      normalized.linkedin = drafts.public;
    }
  }

  return normalized;
}

type SanitizedDraftContextInput = Omit<DraftContextInput, "prs"> & {
  prs?: PR[];
};

type SanitizedDraftRegenerateArgs = Omit<DraftRegenerateArgs, "contextInput"> & {
  contextInput?: SanitizedDraftContextInput;
};

export function useDrafts() {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const regenerate = useCallback(async (args: DraftRegenerateArgs) => {
    const payload = sanitizeDraftRegenerateArgs(args);

    try {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await safeParseJSON(res);
        const message =
          typeof errorBody?.error === "string"
            ? errorBody.error
            : res.status === 500
            ? "Server error while generating outputs. Please check console logs for details."
            : res.status === 401 || res.status === 403
            ? "Authentication error. Please check your API credentials."
            : res.status === 429
            ? "Rate limit exceeded. Please wait a moment and try again."
            : `Failed to regenerate drafts (status ${res.status})`;
        throw new Error(message);
      }

      const data = (await res.json()) as DraftsResponse;
      console.log('[useDrafts] Received API response:', {
        hasDrafts: !!data?.drafts,
        draftKeys: data?.drafts ? Object.keys(data.drafts) : [],
        draftLengths: data?.drafts ? Object.fromEntries(Object.entries(data.drafts).map(([key, val]) => [key, val.length])) : {},
      });

      const draftsForUI = data?.drafts ? mapDraftsForUI(data.drafts) : {};
      console.log('[useDrafts] After mapping for UI:', {
        mappedKeys: Object.keys(draftsForUI),
        mappedLengths: Object.fromEntries(Object.entries(draftsForUI).map(([key, val]) => [key, val.length])),
        sampleInternal: draftsForUI.internal?.substring(0, 50) + '...',
      });

      setDrafts(draftsForUI);
      console.log('[useDrafts] State updated with drafts');

      return { ...data, drafts: draftsForUI };
    } catch (error) {
      // Re-throw with better context if it's a network error
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Network error. Please check your internet connection and try again.");
      }
      throw error;
    }
  }, []);

  return { drafts, regenerate };
}

function sanitizeDraftRegenerateArgs(args: DraftRegenerateArgs): SanitizedDraftRegenerateArgs {
  const contextInput = args.contextInput ? { ...args.contextInput } : undefined;

  if (contextInput?.prs) {
    const sanitized = contextInput.prs
      .map((pr) => sanitizeDraftPR(pr))
      .filter((pr): pr is PR => Boolean(pr));

    if (sanitized.length > 0) {
      contextInput.prs = sanitized;
    } else {
      delete contextInput.prs;
    }
  }

  return {
    ...args,
    contextInput: contextInput as SanitizedDraftContextInput | undefined,
  };
}

function sanitizeDraftPR(pr: Partial<PR> | undefined): PR | null {
  if (!pr || typeof pr !== "object") {
    return null;
  }

  const { number, title, repo } = pr;
  if (typeof number !== "number" || typeof title !== "string" || typeof repo !== "string") {
    return null;
  }

  return {
    id: typeof pr.id === "string" ? pr.id : String(pr.number),
    number,
    title,
    author: {
      name: typeof pr.author?.name === "string" ? pr.author.name : "",
      avatar: typeof pr.author?.avatar === "string" ? pr.author.avatar : "",
    },
    labels: Array.isArray(pr.labels)
      ? pr.labels.filter((label): label is string => typeof label === "string")
      : [],
    mergedDate: typeof pr.mergedDate === "string" ? pr.mergedDate : "",
    repo,
    branch: typeof pr.branch === "string" ? pr.branch : "",
    filesChanged: typeof pr.filesChanged === "number" ? pr.filesChanged : 0,
    riskLevel: pr.riskLevel,
  };
}

async function safeParseJSON(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

export function useReview() {
  const [state, setState] = useState<{status: string; comments: any[]}>({ status: "draft", comments: [] });
  const refresh = useCallback(async () => {
    const d = await fetch("/api/review").then(r=>r.json());
    setState(d);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const act = useCallback(async (action: string, payload?: any) => {
    const d = await fetch("/api/review", { method: "POST", body: JSON.stringify({ action, ...payload })}).then(r=>r.json());
    setState(d);
  }, []);
  return { state, refresh, act };
}

export async function publish(channels: Record<string, boolean>, drafts: Record<string,string>) {
  const res = await fetch("/api/publish", { method: "POST", body: JSON.stringify({ channels, drafts }) });
  return res.json();
}

// Summary generation hook -----------------------------------------------------

export interface ToneSettings {
  conciseDetailed: number;
  playfulFormal: number;
  technicalLay: number;
}

export interface SummaryFields {
  technicalSummary: string;
  userFacingValue: string;
  whatChanged: string;
  whyNow: string;
}

export function useSummaryGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generate = useCallback(async (prs: PR[], tone: ToneSettings): Promise<SummaryFields> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prs, tone }),
      });

      if (!res.ok) {
        const errorBody = await safeParseJSON(res);
        const message =
          typeof errorBody?.error === "string"
            ? errorBody.error
            : `Failed to generate summary (status ${res.status})`;
        throw new Error(message);
      }

      const data = await res.json();
      return {
        technicalSummary: data.technicalSummary || "Not enough information",
        userFacingValue: data.userFacingValue || "Not enough information",
        whatChanged: data.whatChanged || "Not enough information",
        whyNow: data.whyNow || "Not enough information",
      };
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generate, loading, error };
}
