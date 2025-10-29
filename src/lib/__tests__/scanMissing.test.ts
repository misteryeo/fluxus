import { scanTBD, scanUnknownTokens } from '@/utils/scanMissing';
import { Audience } from '@/types/audience';

describe('scanTBD', () => {
  const testAudience: Audience = 'internal';

  it('should detect basic [TBD] patterns', () => {
    const text = 'This feature is [TBD] and needs more work.';
    const result = scanTBD(text, testAudience);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      key: 'notes',
      label: 'Additional notes',
      audience: testAudience,
      hint: 'Any additional context or notes',
    });
  });

  it('should detect [TBD: hint] patterns with specific hints', () => {
    const text = 'Access: [TBD: how to access]';
    const result = scanTBD(text, testAudience);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      key: 'meta.access',
      label: 'Access instructions',
      audience: testAudience,
      hint: 'How users enable/see this feature',
    });
  });

  it('should detect KPI patterns', () => {
    const text = 'Expected impact: [TBD KPI or expected impact]';
    const result = scanTBD(text, testAudience);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      key: 'metrics.kpi',
      label: 'KPI / leading indicator',
      audience: testAudience,
      hint: 'Key performance indicators or success metrics',
    });
  });

  it('should detect PR link patterns', () => {
    const text = 'PR: [TBD]';
    const result = scanTBD(text, testAudience);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      key: 'links.prUrl',
      label: 'PR link',
      audience: testAudience,
      hint: 'Link to the pull request',
    });
  });

  it('should detect Linear link patterns', () => {
    const text = 'Linear: [TBD]';
    const result = scanTBD(text, testAudience);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      key: 'links.linearUrl',
      label: 'Linear link',
      audience: testAudience,
      hint: 'Link to the Linear ticket',
    });
  });

  it('should detect audience notes patterns', () => {
    const text = 'Audience: [TBD: audience]';
    const result = scanTBD(text, testAudience);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      key: 'meta.audienceNotes',
      label: 'Audience eligibility',
      audience: testAudience,
      hint: 'Who can use this feature and any restrictions',
    });
  });

  it('should handle multiple TBD patterns', () => {
    const text = 'Access: [TBD: how to access]. KPI: [TBD KPI or expected impact]. PR: [TBD]';
    const result = scanTBD(text, testAudience);
    
    expect(result).toHaveLength(3);
    expect(result.map(item => item.key)).toEqual(['meta.access', 'metrics.kpi', 'links.prUrl']);
  });

  it('should deduplicate same key for same audience', () => {
    const text = 'Access: [TBD: how to access]. Also access: [TBD: how to access]';
    const result = scanTBD(text, testAudience);
    
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('meta.access');
  });

  it('should handle case insensitive hints', () => {
    const text = 'Access: [TBD: HOW TO ACCESS]';
    const result = scanTBD(text, testAudience);
    
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('meta.access');
  });

  it('should handle partial matches', () => {
    const text = 'Access instructions: [TBD: access]';
    const result = scanTBD(text, testAudience);
    
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('meta.access');
  });

  it('should return empty array for text without TBD patterns', () => {
    const text = 'This is a complete text without any TBD patterns.';
    const result = scanTBD(text, testAudience);
    
    expect(result).toHaveLength(0);
  });
});

describe('scanUnknownTokens', () => {
  it('should detect unknown token patterns', () => {
    const text = 'This has [UNKNOWN: foo.bar] and [UNKNOWN: meta.unknown] tokens.';
    const result = scanUnknownTokens(text);
    
    expect(result).toHaveLength(2);
    expect(result).toEqual(['foo.bar', 'meta.unknown']);
  });

  it('should deduplicate unknown tokens', () => {
    const text = 'This has [UNKNOWN: foo.bar] and [UNKNOWN: foo.bar] repeated.';
    const result = scanUnknownTokens(text);
    
    expect(result).toHaveLength(1);
    expect(result).toEqual(['foo.bar']);
  });

  it('should handle case insensitive patterns', () => {
    const text = 'This has [unknown: foo.bar] tokens.';
    const result = scanUnknownTokens(text);
    
    expect(result).toHaveLength(1);
    expect(result).toEqual(['foo.bar']);
  });

  it('should return empty array for text without unknown tokens', () => {
    const text = 'This is a normal text without unknown tokens.';
    const result = scanUnknownTokens(text);
    
    expect(result).toHaveLength(0);
  });
});
