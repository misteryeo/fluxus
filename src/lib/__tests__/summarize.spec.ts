import { extractTechnicalSummary, extractValueSummary } from '../summarize';

describe('Summarize API', () => {
  describe('extractTechnicalSummary', () => {
    it('should extract technical changes from PR text', () => {
      const prText = `
        feat: Add OAuth 2.0 authentication
        - Implemented JWT token validation
        - Updated user permissions system
        - Added new login endpoint
        - Fixed security vulnerabilities
      `;

      const result = extractTechnicalSummary(prText);
      
      expect(result).not.toBe('[TBD]');
      expect(result).toContain('Added');
      expect(result).toContain('Updated');
      expect(result).toContain('Fixed');
      expect(result.split('\n')).toHaveLength(3);
    });

    it('should handle empty input', () => {
      const result = extractTechnicalSummary('');
      expect(result).toBe('[TBD]');
    });

    it('should handle input without change keywords', () => {
      const prText = 'This is just some random text without any technical changes.';
      const result = extractTechnicalSummary(prText);
      expect(result).toBe('[TBD]');
    });

    it('should normalize change descriptions', () => {
      const prText = 'implemented new feature and updated existing code';
      const result = extractTechnicalSummary(prText);
      
      expect(result).toContain('Added');
      expect(result).toContain('Updated');
    });
  });

  describe('extractValueSummary', () => {
    it('should extract value proposition from ticket text', () => {
      const ticketText = `
        Problem: Users are experiencing slow login times
        Solution: Implement OAuth 2.0 to reduce authentication latency
        Benefit: This will allow users to login 50% faster and improve overall user experience
      `;

      const result = extractValueSummary(ticketText);
      
      expect(result).not.toBe('[TBD]');
      expect(result.length).toBeLessThanOrEqual(280);
      expect(result).toContain('faster');
      expect(result).toContain('improve');
    });

    it('should handle empty input', () => {
      const result = extractValueSummary('');
      expect(result).toBe('[TBD]');
    });

    it('should compress long text to ~280 characters', () => {
      const longText = 'This is a very long text that should be compressed because it exceeds the character limit and needs to be truncated properly with ellipsis at the end to indicate that there is more content that was cut off for brevity and readability purposes in the summary generation process.';
      
      const result = extractValueSummary(longText);
      expect(result.length).toBeLessThanOrEqual(280);
      expect(result.endsWith('...')).toBe(true);
    });

    it('should prioritize benefit phrases', () => {
      const ticketText = 'We need to implement this feature so that users can access the system faster and enable better performance.';
      const result = extractValueSummary(ticketText);
      
      expect(result).toContain('faster');
      expect(result).toContain('enable');
    });
  });
});
