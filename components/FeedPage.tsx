import React, { useEffect, useMemo, useState } from 'react';
import { useSiteVariant } from '../context/SiteVariantContext';
import {
  JOINABLE_FEED_COHORT_IDS,
  JOINED_FEED_COHORT_IDS,
  courseraDisciplineLabelForSlug,
  getAllStreamFeedPlaceholderItems,
  getFeedPlaceholderItems,
  type FeedCohortId,
  type FeedPlaceholderItem,
} from '../constants/feedCohorts';
import { FeedCohortPills } from './feed/FeedCohortPills';
import { FeedDiscoverRail } from './feed/FeedDiscoverRail';
import { FeedTimeline } from './feed/FeedTimeline';
import { Icons } from './Icons';
import { enrichFeedVideoThumbnails } from '../services/unsplashThumbnails';

export const FeedPage: React.FC = () => {
  const { variant, surface } = useSiteVariant();
  /** `null` = All snacks stream (mixed cohorts). */
  const [selectedCohortId, setSelectedCohortId] = useState<FeedCohortId | null>(null);
  /** Optional career-area lens; default is cohort-only feed (no pill selected). */
  const [activeDisciplineSlug, setActiveDisciplineSlug] = useState<string | null>(null);
  /** Cohorts the user joined via the rail CTA (moved from discover into “yours”). */
  const [joinedViaRailIds, setJoinedViaRailIds] = useState<FeedCohortId[]>([]);

  const railJoinedIds = useMemo(
    () => [...JOINED_FEED_COHORT_IDS, ...joinedViaRailIds],
    [joinedViaRailIds]
  );
  const railJoinableIds = useMemo(
    () => JOINABLE_FEED_COHORT_IDS.filter((id) => !joinedViaRailIds.includes(id)),
    [joinedViaRailIds]
  );

  const allStreamCohortIds = useMemo(
    () => [...railJoinedIds, ...railJoinableIds],
    [railJoinedIds, railJoinableIds]
  );

  const activeDisciplineLabel = useMemo(
    () =>
      activeDisciplineSlug ? courseraDisciplineLabelForSlug(activeDisciplineSlug) : undefined,
    [activeDisciplineSlug]
  );

  const feedItems = useMemo(
    () =>
      selectedCohortId === null
        ? getAllStreamFeedPlaceholderItems(allStreamCohortIds, {
            disciplineLabel: activeDisciplineLabel,
            disciplineSlug: activeDisciplineSlug,
          })
        : getFeedPlaceholderItems(selectedCohortId, {
            disciplineLabel: activeDisciplineLabel,
            disciplineSlug: activeDisciplineSlug,
          }),
    [selectedCohortId, allStreamCohortIds, activeDisciplineLabel, activeDisciplineSlug]
  );

  const [feedItemsWithThumbs, setFeedItemsWithThumbs] = useState<FeedPlaceholderItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFeedItemsWithThumbs(null);
    enrichFeedVideoThumbnails(feedItems).then((enriched) => {
      if (!cancelled) setFeedItemsWithThumbs(enriched);
    });
    return () => {
      cancelled = true;
    };
  }, [feedItems]);

  const timelineItems = feedItemsWithThumbs ?? feedItems;

  return (
    <div className="flex-1 bg-[var(--cds-color-grey-25)] overflow-y-auto custom-scrollbar">
      <div
        className={`relative bg-[var(--cds-color-grey-25)] min-h-[min(100%,calc(100vh-5rem))] ${surface.feedBackdropExtraClassName}`}
        data-site-variant={variant}
      >
        <div className="relative z-10 max-w-[1440px] mx-auto px-4 md:px-6 py-4 md:py-5">
          {/* Pinterest-style search + discipline chips above feed */}
          <div className="mb-5 space-y-3">
            <div className="flex w-full items-center rounded-full border border-[var(--cds-color-grey-200)] bg-[var(--cds-color-white)] px-4 py-3 shadow-sm transition-shadow focus-within:border-[var(--cds-color-grey-300)] focus-within:shadow-[0_0_0_2px_rgba(17,17,17,0.06)]">
              <Icons.Search className="mr-3 h-5 w-5 shrink-0 text-[#767676]" strokeWidth={2} aria-hidden />
              <input
                type="search"
                placeholder="Search any topic here."
                className="min-w-0 flex-1 border-0 bg-transparent text-[15px] leading-snug text-[#111111] placeholder:text-[#767676] outline-none"
                aria-label="Search any topic"
              />
            </div>
            <div className="flex min-w-0 items-start gap-3">
              <FeedCohortPills
                variant="coursera"
                activeSlug={activeDisciplineSlug}
                onSelectSlug={(slug) => {
                  setActiveDisciplineSlug(slug);
                  if (slug === null) setSelectedCohortId(null);
                }}
              />
              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-transparent p-0 text-[#111111] transition-colors hover:bg-[var(--cds-color-grey-100)]"
                aria-label="Filters (placeholder)"
              >
                <Icons.FilterSliders className="h-5 w-5 text-[#111111]" strokeWidth={2} aria-hidden />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-4">
            <div className="order-1 min-w-0 lg:col-span-9">
              <FeedTimeline
                key={`${selectedCohortId ?? 'all'}-${activeDisciplineSlug ?? ''}`}
                cohortId={selectedCohortId ?? 'all'}
                items={timelineItems}
              />
            </div>
            <div className="order-2 min-w-0 lg:col-span-3">
              <FeedDiscoverRail
                activeCohortId={selectedCohortId}
                onSelectCohort={setSelectedCohortId}
                joinedCohortIds={railJoinedIds}
                joinableCohortIds={railJoinableIds}
                onJoinCohort={(id) => {
                  setJoinedViaRailIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
                  setSelectedCohortId(id);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
