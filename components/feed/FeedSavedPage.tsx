import React, { useCallback, useState } from 'react';
import { useSiteVariant } from '../../context/SiteVariantContext';
import type { FeedPlaceholderItem } from '../../constants/feedCohorts';
import { FeedPageCategoryPills } from './FeedPageCategoryPills';
import { FullFeedVideoMosaic } from './FullFeedVideoMosaic';
import { useFeedSavedClips } from './feedSavedClips';

export interface FeedSavedPageProps {
  /** Return to the main explore feed. */
  onBackToFeed: () => void;
  onOpenSavedLibrary?: () => void;
}

/**
 * Saved library: back chevron + title + bookmark; no category row. Same mosaic as feed in saved mode.
 */
export const FeedSavedPage: React.FC<FeedSavedPageProps> = ({
  onBackToFeed,
  onOpenSavedLibrary,
}) => {
  const { variant, surface } = useSiteVariant();
  const { saved, isSaved, toggleSave, feedClipStableId } = useFeedSavedClips();
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

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--cds-color-grey-25)]">
      <div
        className={`relative min-h-[min(100%,calc(100vh-5rem))] bg-[var(--cds-color-grey-25)] ${surface.feedBackdropExtraClassName}`}
        data-site-variant={variant}
      >
        <div className="relative z-10 mx-auto max-w-[1440px] px-4 md:px-6 pb-4 md:pb-5 pt-4 md:pt-5">
          <div id="feed-page-videos" data-site-surface="feed">
            <FeedPageCategoryPills
              pageTitle="Saved clips"
              savedPageActive
              selectedSlug={null}
              onSelect={() => {}}
              onBack={onBackToFeed}
              showCategoryTabs={false}
              onOpenSavedLibrary={onOpenSavedLibrary}
              headerBookmarkSaveTick={headerBookmarkSaveTick}
            />
            <FullFeedVideoMosaic
              mode="saved"
              savedClips={saved}
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
