import { Audience } from '@/types/audience';

export interface Template {
  name: string;
  body: string;
  tone: "neutral" | "friendly" | "assertive";
  lengthLimit: number;
  emoji?: boolean;
}

export function getDefaultTemplates(): Record<Audience, Template> {
  return {
    internal: {
      name: 'Internal Template',
      body: `TL;DR
{{ clamp(or(whyNow, summaries.value), 220) }}

What changed
- {{ bullets(summaries.technical, 3) }}

Why it matters
- {{ bullets(or(whyNow, summaries.value), 3) }}

Risks / limitations
- {{ bullets(or(risks, "[Needs to be filled in]"), 3) }}

Links
- PR: {{ or(links.prUrl, "[Needs to be filled in]") }}
- Linear: {{ or(links.linearUrl, "[Needs to be filled in]") }}

Next steps
- {{ bullets(or(nextSteps, "[Needs to be filled in]"), 3) }}`,
      tone: 'neutral',
      lengthLimit: 500,
      emoji: true,
    },
    customer: {
      name: 'Customer Template',
      body: `# {{ meta.featureName }} ({{ upper(or(meta.status, "TBD")) }})

**Value:** {{ clamp(or(whyNow, summaries.value), 300) }}

**What's new**
- {{ bullets(summaries.technical, 3) }}

**Who gets it:** {{ or(whoGetsIt, meta.audienceNotes, meta.access, "[Needs to be filled in]") }}
**How to access:** {{ or(howToAccess, meta.access, "[Needs to be filled in]") }}

Docs: {{ or(links.docsUrl, links.prUrl, "[Needs to be filled in]") }}`,
      tone: 'friendly',
      lengthLimit: 300,
      emoji: true,
    },
    investor: {
      name: 'Investor Template',
      body: `**Shipped:** {{ meta.featureName }} ({{ or(meta.version, "TBD") }}) — {{ upper(or(meta.status, "TBD")) }}

**Why it matters**
- {{ bullets(or(whyNow, summaries.value), 3) }}

**Leading indicators / KPIs**
- {{ or(kpis, metrics.kpi, "[Needs to be filled in]") }}

**Risks / mitigations**
- {{ bullets(or(risks, "[Needs to be filled in]"), 3) }}

**Next milestone**
- {{ or(nextMilestone, "[Needs to be filled in]") }}`,
      tone: 'assertive',
      lengthLimit: 250,
      emoji: false,
    },
    public: {
      name: 'Public Template',
      body: `🚀 {{ meta.featureName }} is live ({{ upper(or(meta.status, "TBD")) }})

{{ clamp(or(whyNow, summaries.value), 220) }}

What's new
- {{ bullets(summaries.technical, 3) }}

Try it: {{ or(howToAccess, meta.access, "[Needs to be filled in]") }}`,
      tone: 'friendly',
      lengthLimit: 250,
      emoji: true,
    },
  };
}
