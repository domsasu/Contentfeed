/**
 * Feed tab category chips (single-select). Slugs match `COURSERA_BROWSE_DISCIPLINES` / `normalizeFeedDisciplineSlugs`.
 * “Life Sciences” uses the `health` discipline for placeholder data.
 */
export const FEED_PAGE_CATEGORY_CHIPS: ReadonlyArray<{ slug: string; label: string }> = [
  { slug: 'physical-science-and-engineering', label: 'Physical Science And Engineering' },
  { slug: 'business', label: 'Business' },
  { slug: 'arts-and-humanities', label: 'Arts And Humanities' },
  { slug: 'social-sciences', label: 'Social Sciences' },
  { slug: 'health', label: 'Life Sciences' },
  { slug: 'data-science', label: 'Data Science' },
  { slug: 'personal-development', label: 'Personal Development' },
  { slug: 'computer-science', label: 'Computer Science' },
];
