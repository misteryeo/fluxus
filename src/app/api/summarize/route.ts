import { NextRequest, NextResponse } from 'next/server';

interface SummarizeRequest {
  prText: string;
  ticketText: string;
}

interface SummarizeResponse {
  technical: string;
  value: string;
}

export function extractTechnicalSummary(prText: string): string {
  if (!prText || prText.trim().length === 0) {
    return '[TBD]';
  }

  // Split into sentences and filter for change-related content
  const sentences = prText
    .split(/[.!?]\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const changeKeywords = [
    'changed', 'added', 'updated', 'removed', 'refactor', 'fix', 'fixed',
    'endpoint', 'route', 'component', 'schema', 'implemented', 'created',
    'modified', 'replaced', 'improved', 'enhanced', 'optimized'
  ];

  const relevantSentences = sentences.filter(sentence => {
    const lowerSentence = sentence.toLowerCase();
    return changeKeywords.some(keyword => lowerSentence.includes(keyword));
  });

  // Take up to 3 most relevant sentences
  const selectedSentences = relevantSentences.slice(0, 3);

  if (selectedSentences.length === 0) {
    return '[TBD]';
  }

  // Normalize and clean up the sentences
  const normalizedSentences = selectedSentences.map(sentence => {
    let normalized = sentence
      .replace(/^[•\-\*]\s*/, '') // Remove bullet points
      .replace(/^\[.*?\]\s*/, '') // Remove PR labels
      .replace(/^[a-zA-Z0-9\-_]+\s*:\s*/, '') // Remove prefixes like "feat:", "fix:"
      .trim();

    // Normalize to "Changed ...", "Added ...", etc.
    const lowerNormalized = normalized.toLowerCase();
    if (lowerNormalized.includes('added') || lowerNormalized.includes('implemented') || lowerNormalized.includes('created')) {
      normalized = 'Added ' + normalized.replace(/^(added|implemented|created)\s+/i, '');
    } else if (lowerNormalized.includes('updated') || lowerNormalized.includes('modified') || lowerNormalized.includes('improved')) {
      normalized = 'Updated ' + normalized.replace(/^(updated|modified|improved)\s+/i, '');
    } else if (lowerNormalized.includes('removed') || lowerNormalized.includes('deleted')) {
      normalized = 'Removed ' + normalized.replace(/^(removed|deleted)\s+/i, '');
    } else if (lowerNormalized.includes('fixed') || lowerNormalized.includes('fix')) {
      normalized = 'Fixed ' + normalized.replace(/^(fixed|fix)\s+/i, '');
    } else if (lowerNormalized.includes('changed') || lowerNormalized.includes('refactor')) {
      normalized = 'Changed ' + normalized.replace(/^(changed|refactor)\s+/i, '');
    }

    // Remove emojis and clean up
    normalized = normalized
      .replace(/[^\w\s.,;:!?\-()]/g, '') // Remove emojis and special chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    return normalized;
  });

  return normalizedSentences.join('\n');
}

export function extractValueSummary(ticketText: string): string {
  if (!ticketText || ticketText.trim().length === 0) {
    return '[TBD]';
  }

  // Look for problem/benefit phrases
  const benefitPhrases = [
    'so that', 'allow', 'enable', 'reduce', 'faster', 'improve', 'enhance',
    'better', 'easier', 'simpler', 'increase', 'decrease', 'optimize',
    'streamline', 'automate', 'eliminate', 'prevent', 'avoid'
  ];

  // Split into sentences
  const sentences = ticketText
    .split(/[.!?]\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  // Find sentences with benefit phrases
  const benefitSentences = sentences.filter(sentence => {
    const lowerSentence = sentence.toLowerCase();
    return benefitPhrases.some(phrase => lowerSentence.includes(phrase));
  });

  // If no benefit sentences found, take the first few sentences
  const selectedSentences = benefitSentences.length > 0 
    ? benefitSentences 
    : sentences.slice(0, 2);

  if (selectedSentences.length === 0) {
    return '[TBD]';
  }

  // Join and compress to ~280 characters
  let combined = selectedSentences.join(' ');
  
  // Clean up
  combined = combined
    .replace(/[^\w\s.,;:!?\-()]/g, '') // Remove emojis and special chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Truncate if too long
  if (combined.length > 280) {
    combined = combined.slice(0, 277) + '...';
  }

  return combined;
}

export async function POST(request: NextRequest) {
  try {
    const body: SummarizeRequest = await request.json();

    // Validate inputs
    if (typeof body.prText !== 'string' || typeof body.ticketText !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input: prText and ticketText must be strings' },
        { status: 400 }
      );
    }

    // Extract summaries
    const technical = extractTechnicalSummary(body.prText);
    const value = extractValueSummary(body.ticketText);

    const response: SummarizeResponse = {
      technical,
      value
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Summarize API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
