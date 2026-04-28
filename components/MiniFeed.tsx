/**
 * Mini feed — compact Home preview of community clips (first joined cohort), with a career-goal rail label.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_FEED_DISCIPLINE_SLUGS,
  FEED_COHORT_META,
  JOINED_FEED_COHORT_IDS,
  getFeedPlaceholderItems,
  type FeedCohortId,
  type FeedPlaceholderItem,
} from '../constants/feedCohorts';
import {
  DATA_SCIENCE_DISCIPLINE_SLUG,
  FEED_DATA_SCIENCE_PREVIEW_VIDEOS,
} from '../constants/feedPreviewVideos';
import { isFeedElementFullyVisible } from './feed/feedViewport';
import { FeedClipVideoPreview } from './feed/FeedClipVideoPreview';
import { FeedVideoDescriptionLine } from './feed/FeedVideoDescriptionLine';
import {
  MINI_FEED_CLIP_SRC_BY_VIDEO_INDEX,
  MINI_FEED_CLIP_VIDEO_SRC,
  MINI_FEED_SEGMENT_MS,
  MINI_FEED_VIDEO_FRAME,
} from './feed/feedMiniLayoutConstants';

const PAGE_SIZE = 5;
const MAX_MINI_FEED_ITEMS = 9;

export interface MiniFeedProps {
  /** Opens the full Feed view. */
  onOpenFeed: () => void;
  /**
   * When the mini-feed section is fully on-screen and at least one preview video is cycling,
   * `true` so the parent can pause competing hero autoplay (e.g. Home intro video).
   */
  onMiniFeedClipPlayingChange?: (playing: boolean) => void;
  /** User’s target role; shown in the career feed rail chip. */
  careerGoalTitle?: string;
}

export const MiniFeed: React.FC<MiniFeedProps> = ({
  onOpenFeed,
  onMiniFeedClipPlayingChange,
  careerGoalTitle,
}) => {
  const firstCohortId: FeedCohortId = JOINED_FEED_COHORT_IDS[0] ?? 'careerswitchers';
  const cohortMeta = FEED_COHORT_META[firstCohortId];
  const goalChipLabel = careerGoalTitle?.trim() || cohortMeta.pillLabel;
  /** Matches FeedPage default pills so preview MOV assets align with Community timeline. */
  const dataScienceLensActive = DEFAULT_FEED_DISCIPLINE_SLUGS.includes(DATA_SCIENCE_DISCIPLINE_SLUG);

  const openCommunityFeed = useCallback(() => {
    onOpenFeed();
  }, [onOpenFeed]);

  /**
   * Video rows only. Lead with the same video sequence as Community for the first joined cohort
   * (e.g. #careerswitchers) and default discipline pills; then fill from the prior cross-cohort pool.
   */
  const allItems = useMemo(() => {
    const seen = new Set<string>();
    const out: FeedPlaceholderItem[] = [];
    const take = (item: FeedPlaceholderItem) => {
      if (item.type !== 'video') return;
      const k = `${item.type}\0${item.title}`;
      if (seen.has(k)) return;
      seen.add(k);
      if (out.length >= MAX_MINI_FEED_ITEMS) return;
      out.push(item);
    };

    const lead = getFeedPlaceholderItems(firstCohortId, {
      disciplineSlugs: [...DEFAULT_FEED_DISCIPLINE_SLUGS],
    });
    for (const it of lead) {
      take(it);
      if (out.length >= MAX_MINI_FEED_ITEMS) return out;
    }

    for (const id of JOINED_FEED_COHORT_IDS) {
      for (const item of getFeedPlaceholderItems(id, {})) {
        take(item);
        if (out.length >= MAX_MINI_FEED_ITEMS) return out;
      }
    }
    return out;
  }, [firstCohortId]);

  const sectionRef = useRef<HTMLElement | null>(null);
  const [sectionFullyOnScreen, setSectionFullyOnScreen] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const update = () => {
      setSectionFullyOnScreen(isFeedElementFullyVisible(el));
    };

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

  const pageCount = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));
  const [pageIndex, setPageIndex] = useState(0);
  const safePage = Math.min(pageIndex, pageCount - 1);
  const items = useMemo(
    () => allItems.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [allItems, safePage]
  );

  const videoSlotIndices = useMemo(() => items.map((_, idx) => idx), [items]);

  const [activeVideoSlotQi, setActiveVideoSlotQi] = useState(0);
  const [segmentNonce, setSegmentNonce] = useState(0);
  const [clipUnmuted, setClipUnmuted] = useState(false);

  useEffect(() => {
    setPageIndex((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  useEffect(() => {
    setActiveVideoSlotQi(0);
    setSegmentNonce(0);
  }, [safePage, items]);

  useEffect(() => {
    if (!sectionFullyOnScreen) {
      setClipUnmuted(false);
    }
  }, [sectionFullyOnScreen]);

  useEffect(() => {
    if (!sectionFullyOnScreen || videoSlotIndices.length === 0) return;
    const id = window.setInterval(() => {
      setSegmentNonce((n) => n + 1);
      setActiveVideoSlotQi((q) => {
        const len = videoSlotIndices.length;
        if (len <= 1) return 0;
        return (q + 1) % len;
      });
    }, MINI_FEED_SEGMENT_MS);
    return () => window.clearInterval(id);
  }, [sectionFullyOnScreen, videoSlotIndices, safePage, items]);

  const miniFeedPreviewVideosActive =
    sectionFullyOnScreen && videoSlotIndices.length > 0;

  useEffect(() => {
    onMiniFeedClipPlayingChange?.(miniFeedPreviewVideosActive);
  }, [miniFeedPreviewVideosActive, onMiniFeedClipPlayingChange]);

  const activeVideoItemIndex =
    videoSlotIndices.length > 0 ? videoSlotIndices[activeVideoSlotQi % videoSlotIndices.length]! : -1;

  return (
    <section
      ref={sectionRef}
      className="rounded-[var(--cds-border-radius-200)] bg-[var(--cds-color-white)] p-4 sm:p-5 text-left"
      aria-label={
        careerGoalTitle
          ? `Clips for your ${careerGoalTitle} goal in ${cohortMeta.label}. Use See all to open the full feed.`
          : `Feed for ${cohortMeta.label}. Use See all to open the full feed.`
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={openCommunityFeed}
          className="inline-flex items-center gap-2 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-700)] focus-visible:ring-offset-2"
        >
          <span className="cds-subtitle-md text-[var(--cds-color-grey-975)]">See all</span>
          <span className="material-symbols-rounded text-[var(--cds-color-grey-600)]" style={{ fontSize: '20px' }}>
            arrow_forward
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:grid-rows-[auto_auto] sm:items-stretch sm:gap-x-5 sm:gap-y-4">
        <div className="flex min-h-0 w-full flex-col items-center justify-center gap-2 border-b border-[var(--cds-color-grey-100)] pb-4 text-center sm:row-start-1 sm:col-start-1 sm:h-full sm:border-b-0 sm:border-r sm:border-[var(--cds-color-grey-100)] sm:pb-0 sm:pr-5">
          <p className="cds-body-secondary max-w-[12rem] text-[var(--cds-color-grey-800)]">
            Your career feed
          </p>
          <span
            className="cds-body-tertiary max-w-[12rem] truncate rounded-[var(--cds-border-radius-400)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] px-2 py-0.5 text-[var(--cds-color-grey-700)]"
            title={goalChipLabel}
          >
            {goalChipLabel}
          </span>
        </div>

        <div className="grid min-h-0 min-w-0 grid-cols-2 items-stretch gap-2 sm:row-start-1 sm:col-start-2 sm:flex sm:min-h-0 sm:min-w-0 sm:flex-nowrap sm:items-stretch sm:gap-3">
            {items.map((item, i) => {
              const globalIndex = safePage * PAGE_SIZE + i;
              const rowKey = `mini-${globalIndex}-${item.type}-${item.title.slice(0, 32)}`;
              const openRow = openCommunityFeed;

              const tileBase =
                'flex h-full min-w-0 sm:flex-1 flex-col overflow-hidden rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] text-left transition-colors hover:border-[var(--cds-color-grey-200)]';

              const isActiveVideoSegment = i === activeVideoItemIndex;
              const videoOrdinalAmongVideos = i;
              const clipSrc =
                dataScienceLensActive &&
                videoOrdinalAmongVideos < FEED_DATA_SCIENCE_PREVIEW_VIDEOS.length
                  ? FEED_DATA_SCIENCE_PREVIEW_VIDEOS[videoOrdinalAmongVideos]!
                  : MINI_FEED_CLIP_SRC_BY_VIDEO_INDEX[
                      dataScienceLensActive
                        ? videoOrdinalAmongVideos - FEED_DATA_SCIENCE_PREVIEW_VIDEOS.length
                        : videoOrdinalAmongVideos
                    ] ?? MINI_FEED_CLIP_VIDEO_SRC;

              const videoFrameClass = `${MINI_FEED_VIDEO_FRAME} group`;

              const videoMeta = (
                <>
                  <div className={videoFrameClass}>
                    <FeedClipVideoPreview
                      sectionActive={sectionFullyOnScreen}
                      isActiveSegment={isActiveVideoSegment}
                      segmentNonce={segmentNonce}
                      userUnmuted={clipUnmuted}
                      onToggleMute={() => setClipUnmuted((m) => !m)}
                      src={clipSrc}
                    />
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col justify-end px-2 pb-2 pt-1.5">
                    <FeedVideoDescriptionLine item={item} />
                  </div>
                </>
              );

              return (
                <div
                  key={rowKey}
                  role="button"
                  tabIndex={0}
                  className={`${tileBase} cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-700)] focus-visible:ring-offset-2`}
                  onClick={openRow}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openRow();
                    }
                  }}
                >
                  {videoMeta}
                </div>
              );
            })}
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
                onClick={() => setPageIndex(p)}
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
