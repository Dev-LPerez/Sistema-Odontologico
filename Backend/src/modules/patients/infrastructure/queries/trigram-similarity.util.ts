export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function extractTrigrams(text: string): Set<string> {
  const normalized = '  ' + normalizeText(text) + ' ';
  const trigrams = new Set<string>();

  for (let i = 0; i <= normalized.length - 3; i++) {
    trigrams.add(normalized.substring(i, i + 3));
  }

  return trigrams;
}

export function calculateTrigramSimilarity(target: string, query: string | Set<string>): number {
  const targetTrigrams = extractTrigrams(target);
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
