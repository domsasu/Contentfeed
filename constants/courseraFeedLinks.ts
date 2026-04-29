import { courseraDisciplineLabelForSlug } from './feedCohorts';

/**
 * Opens Coursera site search for the **partner/creator** plus a **field/subject** when
 * a browse discipline is known, so results skew toward that creator in that area.
 * Falls back to creator-only search if no slugs (e.g. “All” on Explore).
 */
export function getCourseraCreatorDisciplineSearchUrl(
  clipCreatorName: string | undefined,
  entityFallback: string,
  disciplineSlugs: string[] | undefined
): string | null {
  const name = (clipCreatorName || entityFallback || '').trim();
  if (!name) return null;
  const parts: string[] = [name];
  if (disciplineSlugs?.length) {
    for (const slug of disciplineSlugs) {
      const label = courseraDisciplineLabelForSlug(slug);
      if (label) {
        parts.push(label);
        break;
      }
    }
  }
  const q = parts.join(' ');
  return `https://www.coursera.org/search?query=${encodeURIComponent(q)}`;
}
