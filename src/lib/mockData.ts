import { PR, Template, Asset } from '../types';

export const mockPRs: PR[] = [
  {
    id: '1',
    number: 1247,
    title: 'Add real-time collaboration to billing dashboard',
    author: { name: 'Sarah Chen', avatar: 'SC' },
    labels: ['feature', 'billing', 'high-priority'],
    mergedDate: '2025-11-03',
    repo: 'fluxus/platform',
    branch: 'main',
    filesChanged: 23,
    riskLevel: 'medium',
    selected: true
  },
  {
    id: '2',
    number: 1245,
    title: 'Fix invoice PDF generation for EU customers',
    author: { name: 'Alex Kumar', avatar: 'AK' },
    labels: ['bugfix', 'billing', 'eu-compliance'],
    mergedDate: '2025-11-02',
    repo: 'fluxus/platform',
    branch: 'main',
    filesChanged: 8,
    riskLevel: 'low',
    selected: true
  },
  {
    id: '3',
    number: 1242,
    title: 'Upgrade auth library to v3.2',
    author: { name: 'Jordan Lee', avatar: 'JL' },
    labels: ['security', 'dependencies'],
    mergedDate: '2025-11-01',
    repo: 'fluxus/platform',
    branch: 'main',
    filesChanged: 156,
    riskLevel: 'high',
    selected: false
  },
  {
    id: '4',
    number: 1240,
    title: 'Add support for webhook retries',
    author: { name: 'Morgan Taylor', avatar: 'MT' },
    labels: ['feature', 'api'],
    mergedDate: '2025-10-31',
    repo: 'fluxus/platform',
    branch: 'main',
    filesChanged: 34,
    riskLevel: 'low',
    selected: false
  },
  {
    id: '5',
    number: 1238,
    title: 'Improve dashboard load time by 40%',
    author: { name: 'Casey Wong', avatar: 'CW' },
    labels: ['performance', 'frontend'],
    mergedDate: '2025-10-30',
    repo: 'fluxus/platform',
    branch: 'main',
    filesChanged: 12,
    riskLevel: 'low',
    selected: false
  }
];

export const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Internal #shipped',
    description: 'Quick wins for the engineering team channel',
    audience: 'internal',
    tokens: ['{{version}}', '{{team}}', '{{pr_link}}'],
    toneDefaults: { conciseDetailed: 30, playfulFormal: 70, technicalLay: 80 },
    preview: '🚢 {{version}} just shipped! {{team}} added {{feature}}. Check out #{{pr_link}}'
  },
  {
    id: '2',
    name: 'Customer Slack',
    description: 'Friendly updates for customer-facing channels',
    audience: 'customers',
    tokens: ['{{feature}}', '{{value}}', '{{docs_link}}'],
    toneDefaults: { conciseDetailed: 50, playfulFormal: 40, technicalLay: 30 },
    preview: 'Hey team! We just launched {{feature}} — {{value}}. Learn more: {{docs_link}}'
  },
  {
    id: '3',
    name: 'Changelog & Docs',
    description: 'Structured release notes for documentation',
    audience: 'changelog',
    tokens: ['{{version}}', '{{date}}', '{{feature}}', '{{migration}}'],
    toneDefaults: { conciseDetailed: 70, playfulFormal: 20, technicalLay: 60 },
    constraints: { lineLimit: 50 },
    preview: '## {{version}} — {{date}}\n\n### Added\n- {{feature}}\n\n### Migration\n{{migration}}'
  },
  {
    id: '4',
    name: 'LinkedIn Post',
    description: 'Public product announcements',
    audience: 'linkedin',
    tokens: ['{{feature}}', '{{value}}', '{{cta_link}}'],
    toneDefaults: { conciseDetailed: 40, playfulFormal: 30, technicalLay: 20 },
    constraints: { charLimit: 3000 },
    preview: 'Excited to announce {{feature}}! {{value}} Try it today: {{cta_link}}'
  },
  {
    id: '5',
    name: 'Customer Email',
    description: 'HTML email for customer communications',
    audience: 'email',
    tokens: ['{{customer}}', '{{feature}}', '{{value}}', '{{cta_link}}'],
    toneDefaults: { conciseDetailed: 60, playfulFormal: 30, technicalLay: 30 },
    preview: 'Hi {{customer}},\n\nWe have released {{feature}}. {{value}}\n\n[Learn More]({{cta_link}})'
  },
  {
    id: '6',
    name: 'Investor Update',
    description: 'Quarterly highlights for stakeholders',
    audience: 'investors',
    tokens: ['{{quarter}}', '{{metric}}', '{{impact}}'],
    toneDefaults: { conciseDetailed: 80, playfulFormal: 10, technicalLay: 40 },
    preview: 'Q{{quarter}} Product Update\n\n{{metric}} — {{impact}}'
  }
];

export const mockAssets: Asset[] = [
  {
    id: '1',
    type: 'image',
    name: 'dashboard-screenshot.png',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200',
    caption: 'New real-time collaboration in billing dashboard'
  },
  {
    id: '2',
    type: 'loom',
    name: 'feature-demo.mp4',
    url: 'https://www.loom.com/share/example',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200',
    caption: 'Quick demo of the new feature'
  }
];

export const audienceOutputs = {
  internal: `🚢 v2.4.0 just shipped!

The billing team added real-time collaboration to the dashboard and fixed PDF generation for EU customers.

Key changes:
• Multi-user cursor tracking
• Live updates without refresh
• Fixed VAT formatting in invoices

PRs: #1247, #1245`,
  customers: `Hey team! 👋

We just launched real-time collaboration in your billing dashboard. Now multiple team members can work together seamlessly with live cursors and instant updates.

Plus: EU invoice PDFs now correctly format VAT details.

Check it out in your dashboard → https://app.fluxus.com/billing`,
  changelog: `## v2.4.0 — November 4, 2025

### Added
- Real-time collaboration in billing dashboard
  - Multi-user cursor tracking
  - Live updates without page refresh
  - Presence indicators

### Fixed
- Invoice PDF generation for EU customers now correctly formats VAT
- Improved error handling for webhook retries

### Migration Notes
No breaking changes. Feature is automatically enabled for all users.`,
  linkedin: `Excited to announce real-time collaboration in Fluxus! 🎉

Your billing team can now work together in the dashboard with live cursors, instant updates, and seamless multi-user workflows.

Built for teams that ship fast. Try Fluxus today → https://fluxus.com

#productupdate #saas #collaboration`,
  email: `Hi there,

We've just released v2.4.0 with real-time collaboration for your billing dashboard.

**What's new:**
- See team members working alongside you with live cursors
- Changes appear instantly without refreshing
- Better together workflows

**Also fixed:**
EU invoice PDFs now correctly format VAT details for compliance.

[View Release Notes](https://fluxus.com/changelog/v2.4.0)

Happy shipping,
The Fluxus Team`,
  investors: `Q4 2025 Product Update — November

**Key Releases:**
Real-time collaboration (v2.4.0)

**Impact:**
- 40% reduction in billing reconciliation time
- 2.3x increase in multi-user sessions
- 98% customer satisfaction score

**Adoption:**
Rolled out to 100% of enterprise customers. 67% daily active usage within first week.`
};
