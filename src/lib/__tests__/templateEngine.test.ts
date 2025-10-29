import { compileWithDiagnostics, TemplateContext } from '@/lib/templateEngine';

describe('compileWithDiagnostics', () => {
  const mockContext: TemplateContext = {
    meta: {
      featureName: 'Test Feature',
      status: 'beta',
      access: 'Public',
      audienceNotes: 'All users',
      productArea: ['Authentication'],
      version: 'v1.0.0',
    },
    summaries: {
      technical: 'This is a technical summary',
      value: 'This provides great value',
    },
    links: {
      prUrl: 'https://github.com/repo/pull/123',
      linearUrl: 'https://linear.app/issue/ABC-456',
      docsUrl: 'https://docs.example.com',
    },
    metrics: {
      kpi: '50% improvement',
    },
    notes: 'Additional notes here',
  };

  it('should compile template with known tokens', () => {
    const template = 'Feature: {{ meta.featureName }} - {{ summaries.technical }}';
    const result = compileWithDiagnostics(template, mockContext);
    
    expect(result.text).toBe('Feature: Test Feature - This is a technical summary');
    expect(result.unknownTokens).toHaveLength(0);
  });

  it('should detect unknown tokens', () => {
    const template = 'Feature: {{ meta.featureName }} - {{ unknown.field }} - {{ meta.nonexistent }}';
    const result = compileWithDiagnostics(template, mockContext);
    
    expect(result.text).toBe('Feature: Test Feature - [UNKNOWN: unknown.field] - [UNKNOWN: meta.nonexistent]');
    expect(result.unknownTokens).toHaveLength(2);
    expect(result.unknownTokens).toEqual(['unknown.field', 'meta.nonexistent']);
  });

  it('should handle unknown helper functions', () => {
    const template = 'Feature: {{ meta.featureName }} - {{ unknownHelper(meta.featureName) }}';
    const result = compileWithDiagnostics(template, mockContext);
    
    expect(result.text).toBe('Feature: Test Feature - [UNKNOWN: unknownHelper]');
    expect(result.unknownTokens).toHaveLength(1);
    expect(result.unknownTokens).toEqual(['unknownHelper']);
  });

  it('should handle known helper functions', () => {
    const template = 'Feature: {{ upper(meta.featureName) }}';
    const result = compileWithDiagnostics(template, mockContext);
    
    expect(result.text).toBe('Feature: TEST FEATURE');
    expect(result.unknownTokens).toHaveLength(0);
  });

  it('should handle missing values as TBD', () => {
    const template = 'Feature: {{ meta.featureName }} - {{ meta.missingField }}';
    const result = compileWithDiagnostics(template, mockContext);
    
    expect(result.text).toBe('Feature: Test Feature - [TBD]');
    expect(result.unknownTokens).toHaveLength(0);
  });

  it('should handle empty values as TBD', () => {
    const contextWithEmpty = {
      ...mockContext,
      meta: {
        ...mockContext.meta,
        access: '',
      },
    };
    
    const template = 'Access: {{ meta.access }}';
    const result = compileWithDiagnostics(template, contextWithEmpty);
    
    expect(result.text).toBe('Access: [TBD]');
    expect(result.unknownTokens).toHaveLength(0);
  });

  it('should handle null values as TBD', () => {
    const contextWithNull = {
      ...mockContext,
      meta: {
        ...mockContext.meta,
        access: null as unknown as string,
      },
    };
    
    const template = 'Access: {{ meta.access }}';
    const result = compileWithDiagnostics(template, contextWithNull);
    
    expect(result.text).toBe('Access: [TBD]');
    expect(result.unknownTokens).toHaveLength(0);
  });

  it('should handle complex nested paths', () => {
    const template = 'Product: {{ meta.productArea.0 }} - Status: {{ meta.status }}';
    const result = compileWithDiagnostics(template, mockContext);
    
    expect(result.text).toBe('Product: Authentication - Status: beta');
    expect(result.unknownTokens).toHaveLength(0);
  });

  it('should handle helper functions with multiple arguments', () => {
    const template = 'Feature: {{ clamp(summaries.technical, 20) }}';
    const result = compileWithDiagnostics(template, mockContext);
    
    expect(result.text).toBe('Feature: This is a technic...');
    expect(result.unknownTokens).toHaveLength(0);
  });

  it('should handle mixed known and unknown tokens', () => {
    const template = 'Feature: {{ meta.featureName }} - {{ unknown.field }} - {{ summaries.technical }}';
    const result = compileWithDiagnostics(template, mockContext);
    
    expect(result.text).toBe('Feature: Test Feature - [UNKNOWN: unknown.field] - This is a technical summary');
    expect(result.unknownTokens).toHaveLength(1);
    expect(result.unknownTokens).toEqual(['unknown.field']);
  });

  it('should deduplicate unknown tokens', () => {
    const template = 'Feature: {{ unknown.field }} - {{ unknown.field }} - {{ meta.featureName }}';
    const result = compileWithDiagnostics(template, mockContext);
    
    expect(result.text).toBe('Feature: [UNKNOWN: unknown.field] - [UNKNOWN: unknown.field] - Test Feature');
    expect(result.unknownTokens).toHaveLength(1);
    expect(result.unknownTokens).toEqual(['unknown.field']);
  });

  it('should handle malformed template syntax gracefully', () => {
    const template = 'Feature: {{ meta.featureName } - {{ incomplete';
    const result = compileWithDiagnostics(template, mockContext);
    
    // Should still process what it can
    expect(result.text).toContain('Test Feature');
    expect(result.unknownTokens.length).toBeGreaterThanOrEqual(0);
  });
});