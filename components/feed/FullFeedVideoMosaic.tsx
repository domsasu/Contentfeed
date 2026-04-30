import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FEED_DATA_SCIENCE_PREVIEW_VIDEOS } from '../../constants/feedPreviewVideos';
import type { FeedPlaceholderItem } from '../../constants/feedCohorts';
import { FeedClipVideoPreview } from './FeedClipVideoPreview';
import { FeedTheaterImmersive } from './FeedTheaterImmersive';
import {
  FEED_MOSAIC_TILE_OUTER,
  FEED_MOSAIC_VIDEO_FRAME,
  MINI_FEED_CLIP_SRC_BY_VIDEO_INDEX,
  MINI_FEED_CLIP_VIDEO_SRC,
} from './feedMiniLayoutConstants';
import { isFeedElementFullyVisible } from './feedViewport';
import { exitIfFullscreen, type ImmersiveClip } from './feedImmersiveShared';
import type { SavedFeedClip } from './feedSavedClips';

function getFeedClipSrc(videoOrdinalAmongVideos: number, dataScienceClipLensActive: boolean): string {
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

type MosaicShared = {
  isClipSaved: (id: string) => boolean;
  onToggleSave: (item: FeedPlaceholderItem, clipSrc: string) => void;
  feedClipStableId: (item: FeedPlaceholderItem, clipSrc: string) => string;
};

export type FullFeedVideoMosaicFeedProps = MosaicShared & {
  mode: 'feed';
  items: FeedPlaceholderItem[];
  allVideoItems: FeedPlaceholderItem[];
  dataScienceClipLensActive: boolean;
  clipOrdinalOffset: number;
  pageIndex: number;
  pageCount: number;
  onPageIndexChange: (index: number) => void;
};

export type FullFeedVideoMosaicSavedProps = MosaicShared & {
  mode: 'saved';
  /** Persisted rows — same `item` + `clipSrc` the user saved from the feed. */
  savedClips: SavedFeedClip[];
};

export type FullFeedVideoMosaicProps = FullFeedVideoMosaicFeedProps | FullFeedVideoMosaicSavedProps;

/**
 * One row of video tiles; expanded mode uses a theater viewport overlay with playlist.
 * Feed and Saved library share this implementation so tiles match exactly.
 */
export const FullFeedVideoMosaic: React.FC<FullFeedVideoMosaicProps> = (props) => {
  const { isClipSaved, onToggleSave, feedClipStableId } = props;
  const isFeed = props.mode === 'feed';
  const items = isFeed ? props.items : null;
  const allVideoItems = isFeed ? props.allVideoItems : null;
  const dataScienceClipLensActive = isFeed ? props.dataScienceClipLensActive : false;
  const clipOrdinalOffset = isFeed ? props.clipOrdinalOffset : 0;
  const safePage = isFeed ? props.pageIndex : 0;
  const pageCount = isFeed ? props.pageCount : 1;
  const onPageIndexChange = isFeed ? props.onPageIndexChange : () => {};
  const savedClips = !isFeed ? props.savedClips : [];
  const ds = dataScienceClipLensActive;
  const sectionRef = useRef<HTMLElement | null>(null);
  const [sectionFullyOnScreen, setSectionFullyOnScreen] = useState(false);
  const [activePlayIndex, setActivePlayIndex] = useState<number | null>(null);
  const [clipUnmuted, setClipUnmuted] = useState(false);
  const [clipNonce, setClipNonce] = useState(0);
  const [immersiveList, setImmersiveList] = useState<ImmersiveClip[] | null>(null);
  const [immersiveIndex, setImmersiveIndex] = useState(0);
  const immersiveListRef = useRef<ImmersiveClip[] | null>(null);

  useEffect(() => {
    immersiveListRef.current = immersiveList;
  }, [immersiveList]);

  const inImmersive = immersiveList !== null && immersiveList.length > 0;
  const safeImmersiveIndex =
    inImmersive
      ? Math.min(Math.max(0, immersiveIndex), immersiveList!.length - 1)
      : 0;
  const immersiveItem = inImmersive ? immersiveList![safeImmersiveIndex]! : null;
  const playlistLen = immersiveList?.length ?? 0;

  useEffect(() => {
    if (activePlayIndex === null) return;
    setClipNonce((n) => n + 1);
  }, [activePlayIndex]);

  const closeImmersive = useCallback(() => {
    setImmersiveList(null);
    setImmersiveIndex(0);
    void exitIfFullscreen();
  }, []);

  const goImmersivePrev = useCallback(() => {
    setImmersiveIndex((idx) => (idx <= 0 ? 0 : idx - 1));
  }, []);

  const goImmersiveNext = useCallback(() => {
    setImmersiveIndex((idx) => {
      const L = immersiveListRef.current;
      if (!L?.length) return idx;
      return Math.min(idx + 1, L.length - 1);
    });
  }, []);

  useEffect(() => {
    if (immersiveList === null) {
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [immersiveList]);

  useEffect(() => {
    if (immersiveList === null) {
      return;
    }
    setImmersiveIndex((i) => Math.min(i, Math.max(0, playlistLen - 1)));
  }, [playlistLen, immersiveList]);

  useEffect(() => {
    if (!sectionFullyOnScreen) {
      setClipUnmuted(false);
      setActivePlayIndex(null);
    }
  }, [sectionFullyOnScreen]);

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

  const openImmersiveAtIndex = useCallback(
    (globalIndex: number) => {
      if (props.mode === 'saved') {
        if (savedClips.length < 1) return;
        setActivePlayIndex(null);
        setClipUnmuted(false);
        setImmersiveList(
          savedClips.map((s) => ({ item: s.item, clipSrc: s.clipSrc }))
        );
        setImmersiveIndex(
          Math.min(Math.max(0, globalIndex), savedClips.length - 1)
        );
        return;
      }
      if (!allVideoItems?.length) return;
      const list: ImmersiveClip[] = allVideoItems.map((it, i) => ({
        item: it,
        clipSrc: getFeedClipSrc(i, ds),
      }));
      setActivePlayIndex(null);
      setClipUnmuted(false);
      setImmersiveList(list);
      setImmersiveIndex(
        Math.min(Math.max(0, globalIndex), allVideoItems.length - 1)
      );
    },
    [props.mode, savedClips, allVideoItems, ds]
  );

  const immersiveSaveControl =
    immersiveItem && inImmersive
      ? {
          saved: isClipSaved(feedClipStableId(immersiveItem.item, immersiveItem.clipSrc)),
          onToggle: () => onToggleSave(immersiveItem.item, immersiveItem.clipSrc),
        }
      : undefined;

  const immersiveNode =
    immersiveItem && inImmersive && immersiveList ? (
      <FeedTheaterImmersive
        clips={immersiveList}
        activeIndex={safeImmersiveIndex}
        onPrevClip={goImmersivePrev}
        onNextClip={goImmersiveNext}
        canGoPrev={safeImmersiveIndex > 0}
        canGoNext={safeImmersiveIndex < playlistLen - 1}
        onClose={closeImmersive}
        saveControl={immersiveSaveControl}
      />
    ) : null;

  const sectionAria =
    props.mode === 'saved'
      ? 'Liked videos'
      : 'Video clips for your learning goal';

  return (
    <section
      ref={sectionRef}
      className="p-3 text-left sm:p-4"
      aria-label={sectionAria}
    >
      {typeof document !== 'undefined' && immersiveNode
        ? createPortal(immersiveNode, document.body)
        : null}

      <div className="flex flex-col gap-3 sm:gap-3">
        <div
          className="grid min-h-0 min-w-0 grid-cols-2 items-stretch gap-1.5 sm:gap-2.5 md:grid-cols-3 lg:grid-cols-5"
        >
          {props.mode === 'saved' ? (
            savedClips.length === 0 ? (
              <p className="cds-body-secondary col-span-2 w-full min-w-0 text-[var(--cds-color-grey-600)] md:col-span-3 lg:col-span-5">
                No liked videos yet. Like videos on the feed to see them here.
              </p>
            ) : (
              savedClips.map((s, i) => {
                const rowKey = `saved-${s.id}`;
                const tileBase = `flex h-full ${FEED_MOSAIC_TILE_OUTER} flex-col overflow-hidden rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] text-left transition-colors hover:border-[var(--cds-color-grey-200)] group`;
                const clipId = s.id;
                const saved = isClipSaved(clipId);
                const isActive = sectionFullyOnScreen && activePlayIndex === i;
                const videoFrameClass = `${FEED_MOSAIC_VIDEO_FRAME} group`;
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
                        src={s.clipSrc}
                        capAtSegmentEnd={false}
                        onRequestImmersive={() => openImmersiveAtIndex(i)}
                        saveControl={{
                          saved,
                          onToggle: () => onToggleSave(s.item, s.clipSrc),
                        }}
                        reelInfoItem={s.item.type === 'video' ? s.item : undefined}
                      />
                    </div>
                  </div>
                );
              })
            )
          ) : !items || items.length === 0 ? (
            <p className="cds-body-secondary col-span-2 w-full min-w-0 text-[var(--cds-color-grey-600)] md:col-span-3 lg:col-span-5">
              No clips in this category yet.
            </p>
          ) : (
            items.map((item, i) => {
              const videoOrdinalAmongVideos = clipOrdinalOffset + i;
              const globalIndex = videoOrdinalAmongVideos;
              const rowKey = `feed-tile-p${safePage}-${i}-${item.type}-${item.title.slice(0, 48)}`;
              const tileBase = `flex h-full ${FEED_MOSAIC_TILE_OUTER} flex-col overflow-hidden rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] text-left transition-colors hover:border-[var(--cds-color-grey-200)] group`;
              const clipSrc = getFeedClipSrc(videoOrdinalAmongVideos, ds);
              const clipId = feedClipStableId(item, clipSrc);
              const saved = isClipSaved(clipId);

              const isActive = sectionFullyOnScreen && activePlayIndex === i;
              const videoFrameClass = `${FEED_MOSAIC_VIDEO_FRAME} group`;

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
                      onRequestImmersive={() => openImmersiveAtIndex(globalIndex)}
                      saveControl={{
                        saved,
                        onToggle: () => onToggleSave(item, clipSrc),
                      }}
                      reelInfoItem={item.type === 'video' ? item : undefined}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {isFeed && pageCount > 1 ? (
          <div
            className="flex gap-2"
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
