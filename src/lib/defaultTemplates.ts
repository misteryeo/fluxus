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
{{ clamp(summaries.value, 220) }}

What changed
- {{ bullets(summaries.technical, 3) }}

Why it matters
- {{ bullets(summaries.value, 3) }}

Risks / limitations
- [TBD]

Links
- PR: {{ or(links.prUrl, "[TBD]") }}
- Linear: {{ or(links.linearUrl, "[TBD]") }}

Next steps
- [TBD]`,
      tone: 'neutral',
      lengthLimit: 500,
      emoji: true,
    },
    customer: {
      name: 'Customer Template',
      body: `# {{ meta.featureName }} ({{ upper(or(meta.status, "TBD")) }})

**Value:** {{ clamp(summaries.value, 300) }}

**What's new**
- {{ bullets(summaries.technical, 3) }}

**Who gets it:** {{ or(meta.audienceNotes, "[TBD]") }}
**How to access:** {{ or(meta.access, "[TBD: how to access]") }}

Docs: {{ or(links.docsUrl, "[TBD link]") }}`,
      tone: 'friendly',
      lengthLimit: 300,
      emoji: true,
    },
    investor: {
      name: 'Investor Template',
      body: `**Shipped:** {{ meta.featureName }} ({{ or(meta.version, "TBD") }}) — {{ upper(or(meta.status, "TBD")) }}

**Why it matters**
- {{ bullets(summaries.value, 3) }}

**Leading indicators / KPIs**
- {{ or(metrics.kpi, "[TBD KPI or expected impact]") }}

**Risks / mitigations**
- [TBD]

**Next milestone**
- [TBD date / metric]`,
      tone: 'assertive',
      lengthLimit: 250,
      emoji: false,
    },
    public: {
      name: 'Public Template',
      body: `🚀 {{ meta.featureName }} is live ({{ upper(or(meta.status, "TBD")) }})

{{ clamp(summaries.value, 220) }}

What's new
- {{ bullets(summaries.technical, 3) }}

Try it: {{ or(meta.access, "[TBD: how to access]") }}`,
      tone: 'friendly',
      lengthLimit: 250,
      emoji: true,
    },
  };
}
