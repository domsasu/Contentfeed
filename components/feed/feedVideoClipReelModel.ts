import type { FeedPlaceholderItem } from '../../constants/feedCohorts';

const DEFAULT_ENTITY = 'Coursera';

export interface FeedVideoClipReelModel {
  /** Identity line: institution / industry / cohort theme. */
  entityName: string;
  /** Lesson context / caption. */
  caption: string;
  /** Single letter in the circle avatar. */
  avatarChar: string;
}

function cleanVideoCaption(subtitle: string | undefined, fallbackTitle: string): string {
  if (!subtitle?.trim()) return fallbackTitle;
  let t = subtitle.trim();
  t = t.replace(/\.(Your cohort[\s\S]*)$/i, '.').trim();
  t = t.replace(/^Pooled from [^—]+[—–]\s*/i, '');
  t = t.replace(/^Short placeholder [^—]+[—–]\s*/i, '');
  t = t.replace(/^Short walkthrough from [^—]+[—–]\s*/i, '');
  return t.trim() || fallbackTitle;
}

/**
 * Splits a feed video placeholder title (e.g. "Course clip · … · Data Science")
 * for Reels-style overlays: entity line and caption.
 */
export function getFeedVideoClipReelModel(
  item: FeedPlaceholderItem
): FeedVideoClipReelModel | null {
  if (item.type !== 'video') return null;

  const segs = item.title.split(' · ').map((s) => s.trim()).filter(Boolean);
  if (segs.length === 0) {
    const fromMeta = item.clipCreatorName;
    return {
      entityName: fromMeta || DEFAULT_ENTITY,
      caption: cleanVideoCaption(item.subtitle, item.title),
      avatarChar: ((fromMeta || DEFAULT_ENTITY)[0] || 'C').toUpperCase(),
    };
  }

  const head = segs[0]!;
  const isClip = head === 'Course clip' || head === 'Instructor tip';
  if (!isClip) {
    const fromMeta = item.clipCreatorName;
    return {
      entityName: fromMeta || DEFAULT_ENTITY,
      caption: cleanVideoCaption(item.subtitle, item.title),
      avatarChar: ((fromMeta || DEFAULT_ENTITY)[0] || 'C').toUpperCase(),
    };
  }

  if (item.clipCreatorName) {
    const name = item.clipCreatorName;
    return {
      entityName: name,
      caption: cleanVideoCaption(item.subtitle, item.title),
      avatarChar: (name[0] || 'C').toUpperCase(),
    };
  }

  let entityName = DEFAULT_ENTITY;
  if (segs.length >= 3) {
    entityName = segs[1]!;
  }

  const caption = cleanVideoCaption(item.subtitle, item.title);
  return {
    entityName,
    caption,
    avatarChar: (entityName[0] || 'C').toUpperCase(),
  };
}
