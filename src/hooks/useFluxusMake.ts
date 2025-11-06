import { useEffect, useState, useCallback } from "react";

import type { PR } from "@/types";

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

export function useDrafts() {
  const [drafts, setDrafts] = useState<Record<string,string>>({});
  const regenerate = useCallback(async (args: { contextInput: any; coreSummary: string; tone?: any; audiences?: string[]; }) => {
    const res = await fetch("/api/drafts", { method: "POST", body: JSON.stringify(args) });
    const data = await res.json();
    setDrafts(data.drafts || {});
    return data;
  }, []);
  return { drafts, regenerate };
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
