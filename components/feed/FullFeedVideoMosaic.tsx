import React, { useEffect, useRef, useState } from 'react';
import { FEED_DATA_SCIENCE_PREVIEW_VIDEOS } from '../../constants/feedPreviewVideos';
import type { FeedPlaceholderItem } from '../../constants/feedCohorts';
import { FeedClipVideoPreview } from './FeedClipVideoPreview';
import { FeedVideoDescriptionLine } from './FeedVideoDescriptionLine';
import {
  MINI_FEED_CLIP_SRC_BY_VIDEO_INDEX,
  MINI_FEED_CLIP_VIDEO_SRC,
  MINI_FEED_VIDEO_FRAME,
} from './feedMiniLayoutConstants';
import { isFeedElementFullyVisible } from './feedViewport';

export interface FullFeedVideoMosaicProps {
  items: FeedPlaceholderItem[];
  careerGoalTitle: string;
  /** Left-rail line above the goal chip. */
  goalLineLabel?: string;
  /** When the Data Science category is active, use Sprint 2 preview MOVs for leading tiles. */
  dataScienceClipLensActive: boolean;
  /** Global video index of the first tile on this page (for clip URL rotation). */
  clipOrdinalOffset: number;
  pageIndex: number;
  pageCount: number;
  onPageIndexChange: (index: number) => void;
}

/**
 * One row of video tiles + dot pagination (full Feed). Layout matches Home MiniFeed.
 */
export const FullFeedVideoMosaic: React.FC<FullFeedVideoMosaicProps> = ({
  items,
  careerGoalTitle,
  goalLineLabel = 'Your career feed',
  dataScienceClipLensActive,
  clipOrdinalOffset,
  pageIndex: safePage,
  pageCount,
  onPageIndexChange,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [sectionFullyOnScreen, setSectionFullyOnScreen] = useState(false);
  const [activePlayIndex, setActivePlayIndex] = useState<number | null>(null);
  const [clipUnmuted, setClipUnmuted] = useState(false);
  const [clipNonce, setClipNonce] = useState(0);

  useEffect(() => {
    if (activePlayIndex === null) return;
    setClipNonce((n) => n + 1);
  }, [activePlayIndex]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const update = () => setSectionFullyOnScreen(isFeedElementFullyVisible(el));
    const obs = new IntersectionObserver(update, {
      root: null,
      threshold: Array.from({ length: 21 }, (_, i) => i / 20),
    });
    obs.observe(el);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('scroll', update, { passive: true });
      vv.addEventListener('resize', update);
    }
    update();
    return () => {
      obs.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      if (vv) {
        vv.removeEventListener('scroll', update);
        vv.removeEventListener('resize', update);
      }
    };
  }, []);

  useEffect(() => {
    if (!sectionFullyOnScreen) {
      setClipUnmuted(false);
      setActivePlayIndex(null);
    }
  }, [sectionFullyOnScreen]);

  const ds = dataScienceClipLensActive;
  const goalChip = careerGoalTitle.trim();

  return (
    <section
      ref={sectionRef}
      className="p-4 sm:p-5 text-left"
      aria-label="Video clips for your learning goal"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:grid-rows-[auto_auto] sm:items-stretch sm:gap-x-5 sm:gap-y-4">
        <div className="flex min-h-0 w-full flex-col items-center justify-center gap-2 border-b border-[var(--cds-color-grey-100)] pb-4 text-center sm:row-start-1 sm:col-start-1 sm:h-full sm:border-b-0 sm:border-r sm:border-[var(--cds-color-grey-100)] sm:pb-0 sm:pr-5">
          <p className="cds-body-secondary max-w-[12rem] text-[var(--cds-color-grey-800)]">{goalLineLabel}</p>
          <span
            className="cds-body-tertiary max-w-[12rem] truncate rounded-[var(--cds-border-radius-400)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] px-2 py-0.5 text-[var(--cds-color-grey-700)]"
            title={goalChip}
          >
            {goalChip}
          </span>
        </div>

        <div className="grid min-h-0 min-w-0 grid-cols-2 items-stretch gap-2 sm:row-start-1 sm:col-start-2 sm:flex sm:min-h-0 sm:min-w-0 sm:flex-nowrap sm:items-stretch sm:gap-3">
          {items.length === 0 ? (
            <p className="cds-body-secondary col-span-2 sm:col-span-1 sm:col-start-1 text-[var(--cds-color-grey-600)]">
              No clips in this category yet.
            </p>
          ) : (
            items.map((item, i) => {
              const videoOrdinalAmongVideos = clipOrdinalOffset + i;
              const rowKey = `feed-tile-p${safePage}-${i}-${item.type}-${item.title.slice(0, 48)}`;
              const tileBase =
                'flex h-full min-w-0 sm:flex-1 flex-col overflow-hidden rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] text-left transition-colors hover:border-[var(--cds-color-grey-200)] group';

              const isActive = sectionFullyOnScreen && activePlayIndex === i;
              const clipSrc =
                ds && videoOrdinalAmongVideos < FEED_DATA_SCIENCE_PREVIEW_VIDEOS.length
                  ? FEED_DATA_SCIENCE_PREVIEW_VIDEOS[videoOrdinalAmongVideos]!
                  : MINI_FEED_CLIP_SRC_BY_VIDEO_INDEX[
                      ds
                        ? videoOrdinalAmongVideos - FEED_DATA_SCIENCE_PREVIEW_VIDEOS.length
                        : videoOrdinalAmongVideos
                    ] ?? MINI_FEED_CLIP_VIDEO_SRC;
              const videoFrameClass = `${MINI_FEED_VIDEO_FRAME} group`;

              return (
                <div
                  key={rowKey}
                  className={tileBase}
                  role="group"
                  onMouseEnter={() => {
                    if (sectionFullyOnScreen) setActivePlayIndex(i);
                  }}
                  onMouseLeave={() => setActivePlayIndex(null)}
                  onFocusCapture={() => {
                    if (sectionFullyOnScreen) setActivePlayIndex(i);
                  }}
                  onBlurCapture={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                      setActivePlayIndex(null);
                    }
                  }}
                >
                  <div className={videoFrameClass}>
                    <FeedClipVideoPreview
                      sectionActive={sectionFullyOnScreen}
                      isActiveSegment={isActive}
                      segmentNonce={clipNonce}
                      userUnmuted={clipUnmuted}
                      onToggleMute={() => setClipUnmuted((m) => !m)}
                      src={clipSrc}
                      capAtSegmentEnd={false}
                    />
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col justify-end px-2 pb-2 pt-1.5">
                    <FeedVideoDescriptionLine item={item} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {pageCount > 1 ? (
          <div
            className="flex gap-2 sm:col-start-2 sm:row-start-2"
            role="navigation"
            aria-label="Feed pages"
          >
            {Array.from({ length: pageCount }, (_, p) => (
              <button
                key={p}
                type="button"
                aria-current={p === safePage ? 'page' : undefined}
                aria-label={`Page ${p + 1} of ${pageCount}`}
                onClick={() => onPageIndexChange(p)}
                className={
                  p === safePage
                    ? 'h-2 w-6 shrink-0 rounded-full bg-[var(--cds-color-grey-975)] transition-colors'
                    : 'h-2 w-2 shrink-0 rounded-full bg-[var(--cds-color-grey-200)] transition-colors hover:bg-[var(--cds-color-grey-300)]'
                }
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};
