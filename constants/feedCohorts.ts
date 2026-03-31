/** Feed-only cohort model; presentation data for FeedPage (not tied to course XP). */

export type FeedCohortId =
  | 'enrolled'
  | 'ai'
  | 'careerswitchers'
  | 'design'
  | 'healthcare'
  | 'engineering'
  | 'business'
  | 'marketing'
  | 'finance'
  | 'education'
  | 'startups';

export interface FeedCohortMeta {
  id: FeedCohortId;
  label: string;
  pillLabel: string;
  memberCount: number;
  shortDescription: string;
  joinedByDefault: boolean;
  /** Small green tag next to member count: “New activity” / “New post”. */
  activityPill?: string;
}

export const FEED_COHORT_META: Record<FeedCohortId, FeedCohortMeta> = {
  careerswitchers: {
    id: 'careerswitchers',
    label: 'Career switchers',
    pillLabel: '#careerswitchers',
    memberCount: 634,
    shortDescription:
      'Peers building skills for a new role. Share progress and learn from others making a career change.',
    joinedByDefault: true,
    activityPill: 'New activity',
  },
  enrolled: {
    id: 'enrolled',
    label: 'Coursera community',
    pillLabel: '#coursera',
    memberCount: 1255,
    shortDescription:
      'The broader Coursera learner community. Track how your cohort engages with courses over time.',
    joinedByDefault: true,
  },
  ai: {
    id: 'ai',
    label: 'AI & data',
    pillLabel: '#AIpowered',
    memberCount: 842,
    shortDescription:
      'Focused on AI, ML, and data. Stay motivated with learners on a similar path.',
    joinedByDefault: true,
    activityPill: 'New post',
  },
  design: {
    id: 'design',
    label: 'Design',
    pillLabel: 'Design',
    memberCount: 128000,
    shortDescription:
      'Product design, UX research, and visual craft—snippets from top UX programs.',
    joinedByDefault: false,
    activityPill: 'New activity',
  },
  healthcare: {
    id: 'healthcare',
    label: 'Healthcare',
    pillLabel: 'Healthcare',
    memberCount: 89400,
    shortDescription:
      'Clinical data, public health, and healthcare analytics learning communities.',
    joinedByDefault: false,
  },
  engineering: {
    id: 'engineering',
    label: 'Engineering',
    pillLabel: 'Engineering',
    memberCount: 210000,
    shortDescription: 'Software, systems, and tech career learners pooling course clips.',
    joinedByDefault: false,
  },
  business: {
    id: 'business',
    label: 'Business',
    pillLabel: 'Business',
    memberCount: 156000,
    shortDescription: 'MBA skills, strategy, and operations—feed from related certificates.',
    joinedByDefault: false,
  },
  marketing: {
    id: 'marketing',
    label: 'Marketing',
    pillLabel: 'Marketing',
    memberCount: 98500,
    shortDescription: 'Growth, brand, and digital marketing cohort content.',
    joinedByDefault: false,
  },
  finance: {
    id: 'finance',
    label: 'Finance',
    pillLabel: 'Finance',
    memberCount: 72300,
    shortDescription: 'Accounting, FP&A, and investing programs in one stream.',
    joinedByDefault: false,
    activityPill: 'New post',
  },
  education: {
    id: 'education',
    label: 'Education',
    pillLabel: 'Education',
    memberCount: 54200,
    shortDescription: 'Teaching, learning design, and EdTech specializations.',
    joinedByDefault: false,
  },
  startups: {
    id: 'startups',
    label: 'Startups',
    pillLabel: 'Startups',
    memberCount: 318000,
    shortDescription: 'Founders and early operators sharing startup-relevant courses.',
    joinedByDefault: false,
  },
};

/**
 * Top-level “Explore categories” from coursera.org/browse.
 * Independent from cohorts: cohorts curate feed content; disciplines are a separate career-area filter.
 */
export interface CourseraBrowseDiscipline {
  slug: string;
  label: string;
}

export const COURSERA_BROWSE_DISCIPLINES: CourseraBrowseDiscipline[] = [
  { slug: 'arts-and-humanities', label: 'Arts and Humanities' },
  { slug: 'business', label: 'Business' },
  { slug: 'computer-science', label: 'Computer Science' },
  { slug: 'data-science', label: 'Data Science' },
  { slug: 'health', label: 'Health' },
  { slug: 'information-technology', label: 'Information Technology' },
  { slug: 'language-learning', label: 'Language Learning' },
  { slug: 'math-and-logic', label: 'Math and Logic' },
  { slug: 'personal-development', label: 'Personal Development' },
  {
    slug: 'physical-science-and-engineering',
    label: 'Physical Science and Engineering',
  },
  { slug: 'social-sciences', label: 'Social Sciences' },
];

export function courseraDisciplineLabelForSlug(slug: string): string | undefined {
  return COURSERA_BROWSE_DISCIPLINES.find((d) => d.slug === slug)?.label;
}

/** Cohorts shown as “yours” in the left rail (not in discipline pills). */
export const JOINED_FEED_COHORT_IDS: FeedCohortId[] = (
  Object.keys(FEED_COHORT_META) as FeedCohortId[]
).filter((id) => FEED_COHORT_META[id].joinedByDefault);

/** Generic / discover cohort pills (may overlap conceptually with joinable). */
export const DISCOVER_FEED_COHORT_IDS: FeedCohortId[] = (
  Object.keys(FEED_COHORT_META) as FeedCohortId[]
).filter((id) => !FEED_COHORT_META[id].joinedByDefault);

/** Right rail: cohorts the user can join (placeholders). */
export const JOINABLE_FEED_COHORT_IDS: FeedCohortId[] = [...DISCOVER_FEED_COHORT_IDS];

export type FeedPlaceholderMediaType = 'video' | 'article' | 'podcast';

export interface FeedPlaceholderItem {
  type: FeedPlaceholderMediaType;
  title: string;
  subtitle: string;
  meta: string;
  /** Unsplash (or other) thumbnail for video rows — filled client-side when API key is set. */
  thumbnailUrl?: string;
  /** E.g. "Photo by Name on Unsplash" — show near thumbnail per Unsplash guidelines. */
  thumbnailAttribution?: string;
  /** Photographer / photo page on Unsplash. */
  thumbnailAttributionUrl?: string;
}

const cohortFeedCopy: Record<FeedCohortId, { theme: string; courseHint: string }> = {
  careerswitchers: {
    theme: 'Career switching',
    courseHint: 'Google Data Analytics Professional Certificate',
  },
  enrolled: {
    theme: 'General learning',
    courseHint: 'Courses across Coursera',
  },
  ai: {
    theme: 'AI & machine learning',
    courseHint: 'ML / GenAI specializations',
  },
  design: {
    theme: 'UX & product design',
    courseHint: 'UX Design & Figma fundamentals',
  },
  healthcare: {
    theme: 'Healthcare analytics',
    courseHint: 'Healthcare data & public health programs',
  },
  engineering: {
    theme: 'Engineering & tech',
    courseHint: 'CS and software engineering programs',
  },
  business: {
    theme: 'Business fundamentals',
    courseHint: 'Business and strategy certificates',
  },
  marketing: {
    theme: 'Marketing & growth',
    courseHint: 'Digital marketing and brand courses',
  },
  finance: {
    theme: 'Finance & accounting',
    courseHint: 'Finance and accounting specializations',
  },
  education: {
    theme: 'Education & learning',
    courseHint: 'Teaching and instructional design programs',
  },
  startups: {
    theme: 'Startups & entrepreneurship',
    courseHint: 'Entrepreneurship and venture programs',
  },
};

function lensSuffix(disciplineLabel: string | undefined): string {
  return disciplineLabel
    ? ` Your cohort is highlighting ${disciplineLabel.toLowerCase()}—adjacent ideas from the broader catalog.`
    : '';
}

/**
 * Episodes from **The Coursera Podcast** (public Spotify / Apple Podcasts listings).
 * Episode titles match the show; blurbs are short demo copy for this placeholder feed.
 */
const COURSERA_PODCAST_SHOW = 'The Coursera Podcast';

const COURSERA_PODCAST_EPISODES: ReadonlyArray<{
  title: string;
  blurb: string;
  meta: string;
}> = [
  {
    title: 'Generative AI for Everyone with Andrew Ng',
    blurb: 'Andrew Ng on making generative AI approachable for learners and teams.',
    meta: 'Podcast · ~30 min',
  },
  {
    title: 'Learning About Learning with Barbara Oakley',
    blurb: 'Barbara Oakley on how the brain learns—and practical study strategies.',
    meta: 'Podcast · ~28 min',
  },
  {
    title: 'Supporting Military Transitions with the USO',
    blurb: 'How partners help service members build skills for civilian careers.',
    meta: 'Podcast · ~35 min',
  },
  {
    title: 'Building the Workforce of Tomorrow with AWS',
    blurb: 'Cloud skills, credentials, and training at scale for the labor market.',
    meta: 'Podcast · ~32 min',
  },
  {
    title: 'Navigating Disruption with Suraj Srinivasan',
    blurb: 'Strategy and leadership when industries and business models shift fast.',
    meta: 'Podcast · ~40 min',
  },
  {
    title: 'The Power of Prompt Engineering with Dr. Jules White',
    blurb: 'Prompt design as a skill—patterns, pitfalls, and what works in practice.',
    meta: 'Podcast · ~26 min',
  },
  {
    title: 'Redefining Career Readiness with Texas A&M',
    blurb: 'Universities and employers aligning on what “career ready” means now.',
    meta: 'Podcast · ~33 min',
  },
  {
    title: 'AI and Global Competitiveness with Ylli Bajraktari',
    blurb: 'Policy, talent, and national competitiveness in an AI-driven economy.',
    meta: 'Podcast · ~38 min',
  },
];

function podcastEpisodePairForCohort(
  cohortId: FeedCohortId
): [ (typeof COURSERA_PODCAST_EPISODES)[number], (typeof COURSERA_PODCAST_EPISODES)[number] ] {
  const n = COURSERA_PODCAST_EPISODES.length;
  let h = 2166136261;
  const seedStr = `coursera-podcast:${cohortId}`;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const start = (h >>> 0) % n;
  return [COURSERA_PODCAST_EPISODES[start]!, COURSERA_PODCAST_EPISODES[(start + 1) % n]!];
}

function podcastPlaceholderFromTemplateKey(
  key: 'p1' | 'p2',
  cohortId: FeedCohortId,
  lens: string,
  disciplineTag: string
): FeedPlaceholderItem {
  const [first, second] = podcastEpisodePairForCohort(cohortId);
  const e = key === 'p1' ? first : second;
  return {
    type: 'podcast',
    title: `${e.title}${disciplineTag}`,
    subtitle: `${e.blurb} — ${COURSERA_PODCAST_SHOW}.${lens}`,
    meta: e.meta,
  };
}

/** Six placeholder slots (two of each media type); order is shuffled per cohort below. */
type FeedMediaTemplateKey = 'v1' | 'v2' | 'a1' | 'a2' | 'p1' | 'p2';

function itemFromTemplate(
  key: FeedMediaTemplateKey,
  cohortId: FeedCohortId,
  theme: string,
  courseHint: string,
  lens: string,
  disciplineTag: string
): FeedPlaceholderItem {
  switch (key) {
    case 'v1':
      return {
        type: 'video',
        title: `Course clip · ${theme}${disciplineTag}`,
        subtitle: `Pooled from ${courseHint}—placeholder lesson highlight.${lens}`,
        meta: 'Video · 4:12',
      };
    case 'v2':
      return {
        type: 'video',
        title: `Instructor tip · ${theme}${disciplineTag}`,
        subtitle: `Short placeholder walkthrough tied to courses learners in this cohort take.${lens}`,
        meta: 'Video · 2:05',
      };
    case 'a1':
      return {
        type: 'article',
        title: `Reading list · ${theme}${disciplineTag}`,
        subtitle: `Placeholder article summary: key ideas from this week’s cohort-recommended reads.${lens}`,
        meta: 'Article · 3 min read',
      };
    case 'a2':
      return {
        type: 'article',
        title: `Industry note · ${theme}${disciplineTag}`,
        subtitle: `Placeholder briefing: how teams apply these skills in the wild.${lens}`,
        meta: 'Article · 5 min read',
      };
    case 'p1':
      return podcastPlaceholderFromTemplateKey('p1', cohortId, lens, disciplineTag);
    case 'p2':
      return podcastPlaceholderFromTemplateKey('p2', cohortId, lens, disciplineTag);
  }
}

/** Per-cohort media order so each cohort feels like a distinct feed (same six templates, different rhythm). */
const FEED_MEDIA_ORDER_BY_COHORT: Record<FeedCohortId, FeedMediaTemplateKey[]> = {
  careerswitchers: ['a1', 'v1', 'p1', 'a2', 'v2', 'p2'],
  enrolled: ['a1', 'v2', 'p1', 'p2', 'v1', 'a2'],
  ai: ['v1', 'p2', 'a1', 'v2', 'p1', 'a2'],
  design: ['a2', 'p1', 'v1', 'a1', 'p2', 'v2'],
  healthcare: ['v2', 'a1', 'p1', 'v1', 'a2', 'p2'],
  engineering: ['p2', 'v1', 'a2', 'p1', 'v2', 'a1'],
  business: ['v2', 'a2', 'p2', 'v1', 'a1', 'p1'],
  marketing: ['a1', 'p2', 'v2', 'p1', 'a2', 'v1'],
  finance: ['p1', 'a2', 'v1', 'p2', 'a1', 'v2'],
  education: ['v1', 'a1', 'p1', 'v2', 'a2', 'p2'],
  startups: ['a2', 'v2', 'p1', 'a1', 'v1', 'p2'],
};

function stableDisciplineShuffleSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 — deterministic PRNG for reproducible order per slug. */
function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleTemplateKeysWithSeed(keys: FeedMediaTemplateKey[], seed: number): FeedMediaTemplateKey[] {
  const copy = [...keys];
  const rand = mulberry32(seed);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Base cohort rhythm when no browse tag is selected; otherwise a distinct video/article/podcast order per tag. */
function feedTemplateKeysForCohort(cohortId: FeedCohortId, disciplineSlug: string | null): FeedMediaTemplateKey[] {
  const base = FEED_MEDIA_ORDER_BY_COHORT[cohortId];
  if (!disciplineSlug) return base;
  const seed = stableDisciplineShuffleSeed(`${cohortId}\0${disciplineSlug}`);
  return shuffleTemplateKeysWithSeed(base, seed);
}

function itemsForCohort(
  id: FeedCohortId,
  disciplineLabel: string | undefined,
  disciplineSlug: string | null
): FeedPlaceholderItem[] {
  const { theme, courseHint } = cohortFeedCopy[id];
  const lens = lensSuffix(disciplineLabel);
  const disciplineTag = disciplineLabel ? ` · ${disciplineLabel}` : '';
  const order = feedTemplateKeysForCohort(id, disciplineSlug);
  return order.map((key) => itemFromTemplate(key, id, theme, courseHint, lens, disciplineTag));
}

export interface GetFeedPlaceholderItemsOptions {
  /** Coursera browse discipline label — cohort curation scoped to this career area (not a cohort id). */
  disciplineLabel?: string;
  /** Coursera browse discipline slug — varies placeholder media-type order when switching tags. */
  disciplineSlug?: string | null;
}

export function getFeedPlaceholderItems(
  cohortId: FeedCohortId,
  options?: GetFeedPlaceholderItemsOptions
): FeedPlaceholderItem[] {
  return itemsForCohort(cohortId, options?.disciplineLabel, options?.disciplineSlug ?? null);
}

/** Interleaved items from each cohort for the Snacks “all” stream (one card per cohort per round). */
export function getAllStreamFeedPlaceholderItems(
  cohortIds: FeedCohortId[],
  options?: GetFeedPlaceholderItemsOptions
): FeedPlaceholderItem[] {
  if (cohortIds.length === 0) return [];
  const perCohort = cohortIds.map((id) => getFeedPlaceholderItems(id, options));
  const maxLen = Math.max(...perCohort.map((c) => c.length), 0);
  const out: FeedPlaceholderItem[] = [];
  for (let i = 0; i < maxLen; i++) {
    for (let j = 0; j < perCohort.length; j++) {
      const row = perCohort[j];
      const item = row[i];
      if (item) out.push(item);
    }
  }
  const firstPodcastIdx = out.findIndex((item) => item.type === 'podcast');
  if (firstPodcastIdx > 0) {
    const [podcastLead] = out.splice(firstPodcastIdx, 1);
    out.unshift(podcastLead);
  }
  return out;
}
