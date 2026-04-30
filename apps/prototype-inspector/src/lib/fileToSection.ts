/**
 * Maps changed file paths to logical section ids for highlights / chips.
 * Contentfeed-oriented defaults; edit this table when reusing the inspector elsewhere.
 */
const RULES: { pattern: RegExp; section: string }[] = [
  { pattern: /^components\/feed\/FeedTheaterImmersive/i, section: 'theater' },
  { pattern: /^components\/feed\//i, section: 'feed' },
  { pattern: /^components\/MiniFeed/i, section: 'mini-feed' },
  { pattern: /^components\/FeedPage/i, section: 'feed' },
  { pattern: /^components\/feed\/FeedSavedPage/i, section: 'liked-videos' },
  { pattern: /^App\.tsx$/i, section: 'app-shell' },
  { pattern: /^components\/Home/i, section: 'home' },
];

export function filePathToSectionId(filePath: string): string | null {
  const normalized = filePath.replace(/\\/g, '/').trim();
  for (const { pattern, section } of RULES) {
    if (pattern.test(normalized)) return section;
  }
  if (/^components\//i.test(normalized)) return 'components';
  return null;
}

/** Unique section ids for a list of changed files. */
export function sectionsForFiles(files: string[]): string[] {
  const out = new Set<string>();
  for (const f of files) {
    const id = filePathToSectionId(f);
    if (id) out.add(id);
  }
  return [...out];
}
