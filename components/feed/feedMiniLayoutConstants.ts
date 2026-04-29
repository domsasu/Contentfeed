/**
 * Layout + clip defaults shared by Home MiniFeed and full-page Feed (video strip tiles).
 */

export const MINI_FEED_SEGMENT_MS = 5000;
export const MINI_FEED_SEGMENT_SEC = MINI_FEED_SEGMENT_MS / 1000;

/**
 * Caps reel height to the viewport so 9:16 tiles don’t overflow short screens.
 * width ≤ min(column, 55dvh×9/16) keeps aspect ratio while fitting vertically.
 */
export const MINI_FEED_REEL_SIZE =
  'aspect-[9/16] w-full min-h-0 min-w-0 max-w-[min(100%,calc(55dvh*9/16))] mx-auto shrink-0 overflow-hidden';

/** Full-bleed clip: metadata sits in a bottom gradient overlay (no bar below the video). */
export const MINI_FEED_VIDEO_FRAME = `relative ${MINI_FEED_REEL_SIZE} overflow-hidden rounded-[var(--cds-border-radius-200)] bg-[var(--cds-color-white)]`;

/**
 * Full feed / saved mosaic: fill the card edge-to-edge. Height follows `aspect-[9/16]` from card width
 * (no extra max-width/mx-auto). Card width is capped via FEED_MOSAIC_TILE_OUTER so everything scales together.
 */
export const FEED_MOSAIC_VIDEO_FRAME = `relative aspect-[9/16] w-full min-w-0 overflow-hidden rounded-[var(--cds-border-radius-200)] bg-[var(--cds-color-white)]`;

/**
 * Mosaic cards fill their grid / flex cell; width comes from the parent layout.
 */
export const FEED_MOSAIC_TILE_OUTER = 'w-full min-w-0';

export const MINI_FEED_CLIP_VIDEO_SRC = '/videos/career-change-mini.mov';
export const MINI_FEED_CLIP_VIDEO_SRC_SECOND = '/videos/coursera-video-mini.mov';
export const MINI_FEED_CLIP_VIDEO_SRC_THIRD = '/videos/career-change-3-mini.mov';

export const MINI_FEED_CLIP_SRC_BY_VIDEO_INDEX: readonly string[] = [
  MINI_FEED_CLIP_VIDEO_SRC,
  MINI_FEED_CLIP_VIDEO_SRC_SECOND,
  MINI_FEED_CLIP_VIDEO_SRC_THIRD,
];
