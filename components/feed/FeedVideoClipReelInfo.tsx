import React, { useMemo, useState } from 'react';
import { getCourseraCreatorDisciplineSearchUrl } from '../../constants/courseraFeedLinks';
import { courseraDisciplineLabelForSlug } from '../../constants/feedCohorts';
import type { FeedPlaceholderItem } from '../../constants/feedCohorts';
import { getFeedVideoClipReelModel } from './feedVideoClipReelModel';

const DESCRIPTOR_PX = 12; // px — single-line descriptor
/** Show “more” for longer copy (approx. one Reels line); truncate still from CSS. */
const CAPTION_MOREChar_THRESHOLD = 48;

export interface FeedVideoClipReelInfoProps {
  item: FeedPlaceholderItem;
  /** Slightly looser type on immersive / wide surfaces. */
  size?: 'compact' | 'comfortable';
  className?: string;
}

/**
 * Reels-style left stack: round avatar, bold entity line, single-line caption
 * (truncated with "…" + "more" when the line is too long; tap to expand, "less" to collapse).
 * Designed to sit on a bottom gradient over video.
 */
export const FeedVideoClipReelInfo: React.FC<FeedVideoClipReelInfoProps> = ({
  item,
  size = 'compact',
  className = '',
}) => {
  const m = getFeedVideoClipReelModel(item);
  if (!m) return null;

  const [captionExpanded, setCaptionExpanded] = useState(false);

  const headerSearchHref = useMemo(
    () =>
      item.type === 'video'
        ? getCourseraCreatorDisciplineSearchUrl(
            item.clipCreatorName,
            m.entityName,
            item.clipDisciplineSlugs
          )
        : null,
    [item, m.entityName]
  );

  const firstDiscLabel =
    item.clipDisciplineSlugs?.[0] != null
      ? courseraDisciplineLabelForSlug(item.clipDisciplineSlugs[0]!)
      : null;
  const headerAria = firstDiscLabel
    ? `View Coursera search for ${m.entityName} in ${firstDiscLabel}`
    : `View Coursera search for ${m.entityName}`;
  const caption = m.caption;
  const showMoreCta =
    !captionExpanded && caption.length > CAPTION_MOREChar_THRESHOLD;

  const fsStyle = { fontSize: DESCRIPTOR_PX, lineHeight: 1.35 } as const;

  /* Circle avatars: 0.55× the prior h-8 / sm:h-9 / h-10 sizes (i.e. −45% in each axis). */
  const avatar =
    size === 'comfortable'
      ? 'h-[1.375rem] w-[1.375rem] min-h-[1.375rem] min-w-[1.375rem] text-[0.48rem] font-semibold leading-none'
      : 'h-[1.1rem] w-[1.1rem] min-h-[1.1rem] min-w-[1.1rem] text-[0.41rem] font-semibold leading-none sm:h-[1.238rem] sm:w-[1.238rem] sm:min-h-[1.238rem] sm:min-w-[1.238rem] sm:text-[0.48rem]';
  const nameCls =
    size === 'comfortable'
      ? 'text-base font-bold text-white'
      : 'text-sm font-bold leading-tight text-white';
  return (
    <div
      className={`flex w-full min-w-0 max-w-full flex-col items-stretch gap-1 text-left ${className}`.trim()}
    >
      {headerSearchHref ? (
        <a
          href={headerSearchHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group/header flex w-full min-w-0 items-start gap-2.5 rounded-sm text-left no-underline outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-0 pointer-events-auto"
          aria-label={headerAria}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`shrink-0 ${avatar} flex items-center justify-center rounded-full border border-white/40 bg-gradient-to-br from-white/20 to-white/5 text-white shadow-sm backdrop-blur-sm`}
            aria-hidden
          >
            {m.avatarChar}
          </div>
          <p
            className={`min-w-0 flex-1 text-left ${nameCls} max-w-full truncate text-white group-hover/header:underline group-hover/header:decoration-white/50 group-hover/header:underline-offset-2`}
          >
            {m.entityName}
          </p>
        </a>
      ) : (
        <div className="flex w-full min-w-0 items-start gap-2.5">
          <div
            className={`shrink-0 ${avatar} flex items-center justify-center rounded-full border border-white/40 bg-gradient-to-br from-white/20 to-white/5 text-white shadow-sm backdrop-blur-sm`}
            aria-hidden
          >
            {m.avatarChar}
          </div>
          <p className={`min-w-0 flex-1 text-left ${nameCls} max-w-full truncate`}>
            {m.entityName}
          </p>
        </div>
      )}
      <div className="w-full min-w-0 space-y-1 text-left">
        {captionExpanded ? (
          <div className="min-w-0 max-w-full text-left">
            <p
              className="m-0 whitespace-pre-wrap break-words text-left text-white/90"
              style={fsStyle}
            >
              {caption}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCaptionExpanded(false);
              }}
              className="mt-0.5 text-left text-[12px] font-medium text-white/90 underline decoration-white/30 underline-offset-2 hover:underline"
            >
              less
            </button>
          </div>
        ) : (
          <div className="flex min-w-0 max-w-full min-h-[1.35em] items-baseline justify-start text-left">
            <span
              className="min-w-0 flex-1 cursor-default truncate text-left text-white/90"
              style={fsStyle}
            >
              {caption}
            </span>
            {showMoreCta ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCaptionExpanded(true);
                }}
                className="shrink-0 cursor-pointer border-0 bg-transparent p-0 pl-0.5 text-left font-medium text-white/95 hover:text-white"
                style={fsStyle}
                aria-label="Read full description"
              >
                more
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
