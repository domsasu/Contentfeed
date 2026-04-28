import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSiteVariant } from '../context/SiteVariantContext';
import {
  JOINABLE_FEED_COHORT_IDS,
  JOINED_FEED_COHORT_IDS,
  getAllStreamFeedPlaceholderItems,
  type FeedCohortId,
  type FeedPlaceholderItem,
} from '../constants/feedCohorts';
import { DATA_SCIENCE_DISCIPLINE_SLUG } from '../constants/feedPreviewVideos';
import { FullFeedVideoMosaic } from './feed/FullFeedVideoMosaic';
import { FeedPageCategoryPills } from './feed/FeedPageCategoryPills';
import { useFeedSavedClips } from './feed/feedSavedClips';

const FEED_PAGE_SIZE = 5;

export interface FeedPageProps {
  onNavigateToSaved?: () => void;
  categorySlug: string | null;
  onCategoryChange: (slug: string | null) => void;
}

export const FeedPage: React.FC<FeedPageProps> = ({
  onNavigateToSaved,
  categorySlug,
  onCategoryChange,
}) => {
  const { variant, surface } = useSiteVariant();
  const { isSaved, toggleSave, feedClipStableId } = useFeedSavedClips();
  const [headerBookmarkSaveTick, setHeaderBookmarkSaveTick] = useState(0);

  const onToggleSaveWithHeaderMotion = useCallback(
    (item: FeedPlaceholderItem, clipSrc: string) => {
      const id = feedClipStableId(item, clipSrc);
      const was = isSaved(id);
      toggleSave(item, clipSrc);
      if (!was) {
        setHeaderBookmarkSaveTick((n) => n + 1);
      }
    },
    [isSaved, toggleSave, feedClipStableId]
  );

  const streamCohortIds = useMemo(
    () => Array.from(new Set<FeedCohortId>([...JOINED_FEED_COHORT_IDS, ...JOINABLE_FEED_COHORT_IDS])),
    []
  );

  const disciplineSlugsForQuery = useMemo(
    () => (categorySlug === null ? [] : [categorySlug]),
    [categorySlug]
  );

  const videoItems = useMemo(() => {
    const raw = getAllStreamFeedPlaceholderItems(streamCohortIds, {
      disciplineSlugs: [...disciplineSlugsForQuery],
    });
    const seen = new Set<string>();
    const out: FeedPlaceholderItem[] = [];
    for (const it of raw) {
      if (it.type !== 'video') continue;
      if (seen.has(it.title)) continue;
      seen.add(it.title);
      out.push(it);
    }
    return out;
  }, [streamCohortIds, disciplineSlugsForQuery]);

  const pageCount = Math.max(1, Math.ceil(videoItems.length / FEED_PAGE_SIZE));
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setPageIndex(0);
  }, [categorySlug, videoItems.length]);

  const safePage = Math.min(pageIndex, pageCount - 1);

  useEffect(() => {
    setPageIndex((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  const pageItems = useMemo(
    () => videoItems.slice(safePage * FEED_PAGE_SIZE, safePage * FEED_PAGE_SIZE + FEED_PAGE_SIZE),
    [videoItems, safePage]
  );

  const dataScienceClipLensActive = categorySlug === DATA_SCIENCE_DISCIPLINE_SLUG;

  const clipOrdinalOffset = safePage * FEED_PAGE_SIZE;

  return (
    <div className="flex-1 bg-[var(--cds-color-grey-25)] overflow-y-auto custom-scrollbar">
      <div
        className={`relative bg-[var(--cds-color-grey-25)] min-h-[min(100%,calc(100vh-5rem))] ${surface.feedBackdropExtraClassName}`}
        data-site-variant={variant}
      >
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 md:px-6 pb-4 md:pb-5 pt-4 md:pt-5">
          <div id="feed-page-videos" data-site-surface="feed">
            <FeedPageCategoryPills
              selectedSlug={categorySlug}
              onSelect={onCategoryChange}
              onOpenSavedLibrary={onNavigateToSaved}
              headerBookmarkSaveTick={headerBookmarkSaveTick}
            />
            <FullFeedVideoMosaic
              mode="feed"
              items={pageItems}
              allVideoItems={videoItems}
              dataScienceClipLensActive={dataScienceClipLensActive}
              clipOrdinalOffset={clipOrdinalOffset}
              pageIndex={safePage}
              pageCount={pageCount}
              onPageIndexChange={setPageIndex}
              isClipSaved={isSaved}
              onToggleSave={onToggleSaveWithHeaderMotion}
              feedClipStableId={feedClipStableId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
