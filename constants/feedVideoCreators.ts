/**
 * Well-known partners / institutions with courses in Coursera’s public catalog,
 * bucketed by browse **discipline** (matches `COURSERA_BROWSE_DISCIPLINES` slugs).
 * Used to label Reels-style clip tiles with a plausible creator; pairings are
 * representative, not exhaustive.
 */
export const DEFAULT_PUBLIC_CATALOG_CREATORS: readonly string[] = [
  'Google',
  'Meta',
  'IBM',
  'Microsoft',
  'DeepLearning.AI',
  'University of Michigan',
  'Johns Hopkins University',
  'Stanford University',
  'Yale University',
  'University of London',
  'Imperial College London',
  'HEC Paris',
  'University of Illinois',
  'Duke University',
  'Princeton University',
  'UC Davis',
  'Pennsylvania State University',
  'University of Colorado Boulder',
  'Georgia Institute of Technology',
] as const;

/**
 * Creators with substantial catalog presence in the given area (Data Science, CS, etc.).
 * When a feed category is selected, clip titles pick from the matching list.
 */
export const CREATORS_BY_DISCIPLINE_SLUG: Readonly<Record<string, readonly string[]>> = {
  'data-science': [
    'Google',
    'IBM',
    'DeepLearning.AI',
    'University of Michigan',
    'University of London',
    'Duke University',
    'UC Davis',
    'University of California, Irvine',
  ],
  'computer-science': [
    'Google',
    'Meta',
    'University of London',
    'Duke University',
    'Princeton University',
    'The Hong Kong University of Science and Technology',
    'University of California, San Diego',
  ],
  business: [
    'Wharton (University of Pennsylvania)',
    'University of Michigan',
    'HEC Paris',
    'Google',
    'University of London',
    'University of Illinois',
    'Gies College of Business',
  ],
  'personal-development': [
    'Yale University',
    'University of North Carolina at Chapel Hill',
    'University of Michigan',
    'The Wharton School',
  ],
  health: [
    'Johns Hopkins University',
    'Stanford University',
    'Imperial College London',
    'University of Michigan',
    'University of Minnesota',
  ],
  'arts-and-humanities': [
    'The University of Edinburgh',
    'Yale University',
    'Stanford University',
    'University of Pennsylvania',
  ],
  'social-sciences': [
    'Yale University',
    'University of Toronto',
    'Erasmus University Rotterdam',
    'University of Amsterdam',
  ],
  'math-and-logic': [
    'Imperial College London',
    'Stanford University',
    'University of London',
    'University of California, San Diego',
  ],
  'language-learning': [
    'Yonsei University',
    'Michigan State University',
    'Peking University',
    'Arizona State University',
  ],
  'information-technology': [
    'Google',
    'IBM',
    'Microsoft',
    'University of London',
    'Duke University',
  ],
  'physical-science-and-engineering': [
    'Georgia Institute of Technology',
    'University of Colorado Boulder',
    'Duke University',
    'University of Manchester',
  ],
} as const;

function hashStringToIndex(seed: string, mod: number): number {
  if (mod <= 0) return 0;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % mod;
}

/**
 * Deterministic “random” pick so the same seed always returns the same creator
 * (stable for a given clip) while the feed feels varied.
 */
export function pickPublicCatalogCreator(
  disciplineSlugs: string[],
  seed: string
): string {
  const fromSlug = (slug: string) => CREATORS_BY_DISCIPLINE_SLUG[slug] ?? null;

  let pool: string[] = [];
  if (!disciplineSlugs.length) {
    pool = [...DEFAULT_PUBLIC_CATALOG_CREATORS];
  } else {
    for (const slug of disciplineSlugs) {
      const list = fromSlug(slug);
      if (list) pool.push(...list);
    }
    if (pool.length) {
      pool = [...new Set(pool)];
    } else {
      pool = [...DEFAULT_PUBLIC_CATALOG_CREATORS];
    }
  }
  if (pool.length === 0) {
    return 'Coursera';
  }
  return pool[hashStringToIndex(seed, pool.length)]!;
}
