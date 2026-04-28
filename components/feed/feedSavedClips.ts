import { useCallback, useEffect, useState } from 'react';
import type { FeedPlaceholderItem } from '../../constants/feedCohorts';

const LS_KEY = 'contentfeed-saved-feed-clips-v1';

export type SavedFeedClip = {
  id: string;
  item: FeedPlaceholderItem;
  clipSrc: string;
  savedAt: number;
};

export function feedClipStableId(item: FeedPlaceholderItem, clipSrc: string): string {
  const raw = `${item.title}\0${item.meta}\0${clipSrc}`;
  let h = 0;
  for (let i = 0; i < raw.length; i += 1) {
    h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0;
  }
  return `fc${(h >>> 0).toString(16)}`;
}

function readClips(): SavedFeedClip[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is SavedFeedClip =>
        x != null &&
        typeof (x as SavedFeedClip).id === 'string' &&
        (x as SavedFeedClip).item != null &&
        typeof (x as SavedFeedClip).clipSrc === 'string'
    );
  } catch {
    return [];
  }
}

function writeClips(clips: SavedFeedClip[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(clips));
  } catch {
    /* quota */
  }
}

/**
 * Persists saved feed clips in localStorage and provides toggle / lookup.
 */
export function useFeedSavedClips() {
  const [saved, setSaved] = useState<SavedFeedClip[]>(() => readClips());

  useEffect(() => {
    writeClips(saved);
  }, [saved]);

  const isSaved = useCallback(
    (id: string) => saved.some((s) => s.id === id),
    [saved]
  );

  const toggleSave = useCallback((item: FeedPlaceholderItem, clipSrc: string) => {
    const id = feedClipStableId(item, clipSrc);
    setSaved((prev) => {
      const exists = prev.find((p) => p.id === id);
      if (exists) {
        return prev.filter((p) => p.id !== id);
      }
      return [...prev, { id, item, clipSrc, savedAt: Date.now() }];
    });
  }, []);

  return { saved, isSaved, toggleSave, feedClipStableId };
}
