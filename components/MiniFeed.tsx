/**
 * Mini feed — compact Home preview of community clips (first joined cohort), with a career-goal rail label.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
import { FeedTheaterImmersive } from './feed/FeedTheaterImmersive';
import { exitIfFullscreen, type ImmersiveClip } from './feed/feedImmersiveShared';
import { useFeedSavedClips } from './feed/feedSavedClips';
import {
  MINI_FEED_CLIP_SRC_BY_VIDEO_INDEX,
  MINI_FEED_CLIP_VIDEO_SRC,
  MINI_FEED_VIDEO_FRAME,
} from './feed/feedMiniLayoutConstants';

const PAGE_SIZE = 5;
const MAX_MINI_FEED_ITEMS = 9;

/** Clip URL for the n-th video in the mini-feed list (same mapping as full feed mosaic). */
function getMiniFeedClipSrc(videoOrdinalAmongVideos: number, dataScienceClipLensActive: boolean): string {
  const ds = dataScienceClipLensActive;
  if (ds && videoOrdinalAmongVideos < FEED_DATA_SCIENCE_PREVIEW_VIDEOS.length) {
    return FEED_DATA_SCIENCE_PREVIEW_VIDEOS[videoOrdinalAmongVideos]!;
  }
  return (
    MINI_FEED_CLIP_SRC_BY_VIDEO_INDEX[
      ds
        ? videoOrdinalAmongVideos - FEED_DATA_SCIENCE_PREVIEW_VIDEOS.length
        : videoOrdinalAmongVideos
    ] ?? MINI_FEED_CLIP_VIDEO_SRC
  );
}

export interface MiniFeedProps {
  /** Opens the full Feed view. */
  onOpenFeed: () => void;
  /**
   * When the mini-feed section is fully on-screen and the user is hovering a preview clip,
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
  const { isSaved, toggleSave, feedClipStableId } = useFeedSavedClips();
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

  const [hoveredVideoIndex, setHoveredVideoIndex] = useState<number | null>(null);
  const [clipUnmuted, setClipUnmuted] = useState(false);

  const [theaterList, setTheaterList] = useState<ImmersiveClip[] | null>(null);
  const [theaterIndex, setTheaterIndex] = useState(0);
  const theaterListRef = useRef<ImmersiveClip[] | null>(null);
  useEffect(() => {
    theaterListRef.current = theaterList;
  }, [theaterList]);

  const openTheaterAtGlobalIndex = useCallback(
    (globalIndex: number) => {
      if (allItems.length < 1) return;
      const list: ImmersiveClip[] = allItems.map((it, ord) => ({
        item: it,
        clipSrc: getMiniFeedClipSrc(ord, dataScienceLensActive),
      }));
      setTheaterList(list);
      setTheaterIndex(Math.min(Math.max(0, globalIndex), list.length - 1));
    },
    [allItems, dataScienceLensActive]
  );

  const closeTheater = useCallback(() => {
    setTheaterList(null);
    setTheaterIndex(0);
    void exitIfFullscreen();
  }, []);

  const goTheaterPrev = useCallback(() => {
    setTheaterIndex((idx) => (idx <= 0 ? 0 : idx - 1));
  }, []);

  const goTheaterNext = useCallback(() => {
    setTheaterIndex((idx) => {
      const L = theaterListRef.current;
      if (!L?.length) return idx;
      return Math.min(idx + 1, L.length - 1);
    });
  }, []);

  useEffect(() => {
    setPageIndex((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  useEffect(() => {
    setHoveredVideoIndex(null);
  }, [safePage, items]);

  useEffect(() => {
    if (!sectionFullyOnScreen) {
      setClipUnmuted(false);
      setHoveredVideoIndex(null);
    }
  }, [sectionFullyOnScreen]);

  const miniFeedPreviewVideosActive =
    sectionFullyOnScreen && hoveredVideoIndex !== null;

  useEffect(() => {
    onMiniFeedClipPlayingChange?.(miniFeedPreviewVideosActive);
  }, [miniFeedPreviewVideosActive, onMiniFeedClipPlayingChange]);

  useEffect(() => {
    if (theaterList === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [theaterList]);

  const theaterLen = theaterList?.length ?? 0;
  const safeTheaterIndex =
    theaterLen > 0 ? Math.min(Math.max(0, theaterIndex), theaterLen - 1) : 0;
  const theaterClip = theaterList && theaterLen > 0 ? theaterList[safeTheaterIndex]! : null;
  const theaterSaveControl = theaterClip
    ? {
        saved: isSaved(feedClipStableId(theaterClip.item, theaterClip.clipSrc)),
        onToggle: () => toggleSave(theaterClip.item, theaterClip.clipSrc),
      }
    : undefined;
  const theaterNode =
    theaterList && theaterLen > 0 ? (
      <FeedTheaterImmersive
        clips={theaterList}
        activeIndex={safeTheaterIndex}
        onPrevClip={goTheaterPrev}
        onNextClip={goTheaterNext}
        canGoPrev={safeTheaterIndex > 0}
        canGoNext={safeTheaterIndex < theaterLen - 1}
        onClose={closeTheater}
        saveControl={theaterSaveControl}
      />
    ) : null;

  return (
    <section
      ref={sectionRef}
      className="rounded-[var(--cds-border-radius-200)] bg-[var(--cds-color-white)] p-4 sm:p-5 text-left"
      aria-label={
        careerGoalTitle
          ? `Video feed — clips for your ${careerGoalTitle} goal in ${cohortMeta.label}. Use See all to open the full feed.`
          : `Video feed for ${cohortMeta.label}. Use See all to open the full feed.`
      }
    >
      {typeof document !== 'undefined' && theaterNode
        ? createPortal(theaterNode, document.body)
        : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:grid-rows-[auto_auto] sm:items-stretch sm:gap-x-5 sm:gap-y-4">
        <div className="flex min-h-0 w-full min-w-0 flex-col items-stretch justify-start border-b border-[var(--cds-color-grey-100)] pb-4 text-left sm:row-start-1 sm:col-start-1 sm:h-full sm:border-b-0 sm:border-r sm:border-[var(--cds-color-grey-100)] sm:pb-0 sm:pr-5">
          <h2 className="cds-subtitle-lg mb-2 text-[var(--cds-color-grey-975)]">Video Feed</h2>
          <div className="mb-4 flex flex-wrap gap-1">
            <span
              className="cds-body-secondary inline-flex h-8 max-w-full min-w-0 items-center truncate rounded-[var(--cds-border-radius-400)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] px-3 py-1 text-[var(--cds-color-grey-975)]"
              title={goalChipLabel}
            >
              {goalChipLabel}
            </span>
          </div>
        </div>

        <div className="grid min-h-0 min-w-0 grid-cols-2 items-stretch gap-2 sm:row-start-1 sm:col-start-2 sm:flex sm:min-h-0 sm:min-w-0 sm:flex-nowrap sm:items-stretch sm:gap-3">
            {items.map((item, i) => {
              const globalIndex = safePage * PAGE_SIZE + i;
              const rowKey = `mini-${globalIndex}-${item.type}-${item.title.slice(0, 32)}`;
              const openTheater = () => openTheaterAtGlobalIndex(globalIndex);

              const tileBase =
                'flex h-full min-w-0 sm:flex-1 flex-col overflow-hidden rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] text-left transition-colors hover:border-[var(--cds-color-grey-200)]';

              const isActiveVideoSegment = hoveredVideoIndex === i;
              const clipSrc = getMiniFeedClipSrc(globalIndex, dataScienceLensActive);

              const clipId = feedClipStableId(item, clipSrc);
              const saved = isSaved(clipId);

              const videoFrameClass = `${MINI_FEED_VIDEO_FRAME} group`;

              const videoMeta = (
                <div
                  className={videoFrameClass}
                  onMouseEnter={() => {
                    if (sectionFullyOnScreen) setHoveredVideoIndex(i);
                  }}
                  onMouseLeave={() => {
                    setHoveredVideoIndex((h) => (h === i ? null : h));
                    setClipUnmuted(false);
                  }}
                >
                  <FeedClipVideoPreview
                    sectionActive={sectionFullyOnScreen}
                    isActiveSegment={isActiveVideoSegment}
                    segmentNonce={0}
                    userUnmuted={clipUnmuted}
                    onToggleMute={() => setClipUnmuted((m) => !m)}
                    src={clipSrc}
                    reelInfoItem={item.type === 'video' ? item : undefined}
                    saveControl={{
                      saved,
                      onToggle: () => toggleSave(item, clipSrc),
                    }}
                    onRequestImmersive={openTheater}
                  />
                </div>
              );

              return (
                <div
                  key={rowKey}
                  role="button"
                  tabIndex={0}
                  className={`${tileBase} cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-700)] focus-visible:ring-offset-2`}
                  onClick={openTheater}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openTheater();
                    }
                  }}
                >
                  {videoMeta}
                </div>
              );
            })}
        </div>

        <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3 sm:col-start-2 sm:row-start-2">
          <div className="flex min-h-2 min-w-0 flex-1 items-center justify-start sm:flex-initial">
            {pageCount > 1 ? (
              <div
                className="flex shrink-0 items-center gap-2"
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
          <button
            type="button"
            onClick={openCommunityFeed}
            className="inline-flex shrink-0 items-center gap-2 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-700)] focus-visible:ring-offset-2"
          >
            <span className="cds-subtitle-md text-[var(--cds-color-grey-975)]">See all</span>
            <span className="material-symbols-rounded text-[var(--cds-color-grey-600)]" style={{ fontSize: '20px' }}>
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};
