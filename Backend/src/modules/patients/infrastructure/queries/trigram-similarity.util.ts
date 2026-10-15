export function normalizeText(text: string): string {
  if (!/[^\x00-\x7F]/.test(text)) {
    return text.toLowerCase().trim();
  }
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function extractTrigramsFromNormalized(normalized: string): Set<string> {
  const padded = '  ' + normalized + ' ';
  const trigrams = new Set<string>();
  const len = padded.length - 3;

  for (let i = 0; i <= len; i++) {
    trigrams.add(padded.substring(i, i + 3));
  }

  return trigrams;
}

export function extractTrigrams(text: string): Set<string> {
  return extractTrigramsFromNormalized(normalizeText(text));
}

export function calculateTrigramSimilarity(
  target: string | Set<string>,
  query: string | Set<string>,
): number {
  const targetTrigrams = typeof target === 'string' ? extractTrigrams(target) : target;
  const queryTrigrams = typeof query === 'string' ? extractTrigrams(query) : query;

  if (targetTrigrams.size === 0 || queryTrigrams.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const tri of queryTrigrams) {
    if (targetTrigrams.has(tri)) {
      intersection++;
    }
  }

  const union = targetTrigrams.size + queryTrigrams.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
