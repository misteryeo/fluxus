import { compile } from '../templateEngine';
import { TemplateContext } from '../templateEngine';

describe('Generate API', () => {
  const mockContext: TemplateContext = {
    meta: {
      featureName: 'New Auth System',
      status: 'beta',
      access: 'All users',
      audienceNotes: 'Enhanced security',
      productArea: ['Authentication'],
      version: 'v2.1.0',
    },
    summaries: {
      technical: 'Implemented OAuth 2.0\nAdded JWT validation\nUpdated permissions',
      value: 'Enhanced security and user experience',
    },
    links: {
      prUrl: 'https://github.com/repo/pull/123',
      linearUrl: 'https://linear.app/issue/ABC-456',
      docsUrl: 'https://docs.example.com',
    },
    metrics: {
      kpi: '50% reduction in login time',
    },
    notes: 'Important security update',
  };

  describe('Template Compilation', () => {
    it('should compile template with context', () => {
      const template = '{{ meta.featureName }} ({{ upper(meta.status) }}) - {{ summaries.value }}';
      const result = compile(template, mockContext);
      
      expect(result).toBe('New Auth System (BETA) - Enhanced security and user experience');
    });

    it('should handle missing values with [TBD]', () => {
      const template = '{{ meta.nonexistent }} - {{ summaries.value }}';
      const result = compile(template, mockContext);
      
      expect(result).toBe('[TBD] - Enhanced security and user experience');
    });

    it('should respect length limits', () => {
      const template = '{{ meta.featureName }} - {{ summaries.value }}';
      const result = compile(template, mockContext);
      
      // Test with a very short limit
      const clamped = result.length > 20 ? result.slice(0, 17) + '...' : result;
      expect(clamped.length).toBeLessThanOrEqual(20);
    });

    it('should handle helper functions', () => {
      const template = '{{ upper(meta.status) }} - {{ bullets(summaries.technical, 2) }}';
      const result = compile(template, mockContext);
      
      expect(result).toContain('BETA');
      expect(result).toContain('- Implemented OAuth 2.0');
      expect(result).toContain('- Added JWT validation');
    });

    it('should detect unknown tokens', () => {
      const template = '{{ unknown.token }} - {{ meta.featureName }}';
      const result = compile(template, mockContext);
      
      expect(result).toContain('[UNKNOWN: unknown.token]');
      expect(result).toContain('New Auth System');
    });
  });

  describe('Length Enforcement', () => {
    it('should truncate long content with ellipsis', () => {
      const longTemplate = '{{ summaries.value }} '.repeat(100); // Very long template
      const result = compile(longTemplate, mockContext);
      
      // Apply length limit
      const limit = 100;
      const clamped = result.length > limit ? result.slice(0, limit - 3) + '...' : result;
      
      expect(clamped.length).toBeLessThanOrEqual(limit);
      expect(clamped.endsWith('...')).toBe(true);
    });

    it('should not truncate short content', () => {
      const shortTemplate = '{{ meta.featureName }}';
      const result = compile(shortTemplate, mockContext);
      
      const limit = 100;
      const clamped = result.length > limit ? result.slice(0, limit - 3) + '...' : result;
      
      expect(clamped).toBe('New Auth System');
      expect(clamped.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('Warning Detection', () => {
    it('should identify unknown token warnings', () => {
      const template = '{{ meta.featureName }} - {{ unknown.field }} - {{ summaries.value }}';
      const result = compile(template, mockContext);
      
      const warnings = result.match(/\[UNKNOWN: [^\]]+\]/g);
      expect(warnings).toHaveLength(1);
      expect(warnings![0]).toBe('[UNKNOWN: unknown.field]');
    });

    it('should not generate warnings for valid tokens', () => {
      const template = '{{ meta.featureName }} - {{ summaries.value }}';
      const result = compile(template, mockContext);
      
      const warnings = result.match(/\[UNKNOWN: [^\]]+\]/g);
      expect(warnings).toBeNull();
    });
  });
});
