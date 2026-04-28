import type { FeedPlaceholderItem } from '../../constants/feedCohorts';

/**
 * Titles from feed placeholders may include a cohort “theme” segment (e.g. “Career switching”)
 * between clip type and discipline. For a cohort-neutral rail, keep clip type + discipline / last segment.
 */
export function feedVideoTitleNeutral(item: FeedPlaceholderItem): string {
  if (item.type !== 'video') return item.title;
  const segs = item.title.split(' · ').map((s) => s.trim());
  if (segs.length >= 3) {
    return `${segs[0]} · ${segs[segs.length - 1]}`;
  }
  return item.title;
}
