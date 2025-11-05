import { useEffect, useState, useCallback } from "react";

export function usePRs() {
  const [prs, setPRs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/prs").then(r => r.json()).then(d => setPRs(d.prs || [])).finally(() => setLoading(false));
  }, []);
  return { prs, loading };
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
