import { NextResponse } from "next/server";

async function loadModules() {
  const ctx = await import("@/utils/buildContext").catch(() => null);
  const engine = await import("@/lib/templateEngine").catch(() => null);
  const defaults = await import("@/lib/defaultTemplates").catch(() => null);

  return {
    buildContext: ctx?.buildContext ?? ((input: any) => input),
    renderTemplate: engine?.renderTemplate ?? ((tpl: string, c: any) => tpl.replace(/\{\{(\w+)\}\}/g, (_: any, k: string) => c[k] ?? "")),
    defaultTemplates: defaults?.defaultTemplates ?? {
      internal: "Internal: {{summary}}",
      customers: "Customer: {{summary}}",
      changelog: "Changelog: {{summary}}",
      linkedin: "LinkedIn: {{summary}}",
      email: "Email: {{summary}}",
      investor: "Investor: {{summary}}",
    },
  };
}

export async function POST(req: Request) {
  const { contextInput, coreSummary, tone, audiences } = await req.json();
  const { buildContext, renderTemplate, defaultTemplates } = await loadModules();

  const ctx = buildContext({ ...contextInput, summary: coreSummary, tone });
  const target = audiences ?? ["internal","customers","changelog","linkedin","email","investor"];
  const drafts = Object.fromEntries(target.map((a: string) => [a, renderTemplate((defaultTemplates as any)[a], ctx)]));
  return NextResponse.json({ drafts, context: ctx });
}
