import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FEED_DATA_SCIENCE_PREVIEW_VIDEOS } from '../../constants/feedPreviewVideos';
import type { FeedPlaceholderItem } from '../../constants/feedCohorts';
import { FeedClipVideoPreview } from './FeedClipVideoPreview';
import { FeedVideoClipReelInfo } from './FeedVideoClipReelInfo';
import {
  FEED_MOSAIC_TILE_OUTER,
  FEED_MOSAIC_VIDEO_FRAME,
  MINI_FEED_CLIP_SRC_BY_VIDEO_INDEX,
  MINI_FEED_CLIP_VIDEO_SRC,
} from './feedMiniLayoutConstants';
import { isFeedElementFullyVisible } from './feedViewport';
import {
  exitIfFullscreen,
  requestElFullscreen,
  type ImmersiveClip,
} from './feedImmersiveShared';
import { Icons } from '../Icons';
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
 * One row of video tiles; expanded mode uses a playlist in a fullscreen shell.
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
  const immersiveShellRef = useRef<HTMLDivElement | null>(null);
  const immersiveVideoRef = useRef<HTMLVideoElement | null>(null);
  const [sectionFullyOnScreen, setSectionFullyOnScreen] = useState(false);
  const [activePlayIndex, setActivePlayIndex] = useState<number | null>(null);
  const [clipUnmuted, setClipUnmuted] = useState(false);
  const [clipNonce, setClipNonce] = useState(0);
  const [immersiveList, setImmersiveList] = useState<ImmersiveClip[] | null>(null);
  const [immersiveIndex, setImmersiveIndex] = useState(0);
  const immersiveListRef = useRef<ImmersiveClip[] | null>(null);
  const immersiveOpenRef = useRef(false);
  const hadNativeFullscreenRef = useRef(false);

  useEffect(() => {
    immersiveListRef.current = immersiveList;
  }, [immersiveList]);

  const inImmersive = immersiveList !== null && immersiveList.length > 0;
  const safeImmersiveIndex =
    inImmersive
      ? Math.min(Math.max(0, immersiveIndex), immersiveList!.length - 1)
      : 0;
  const immersiveItem = inImmersive ? immersiveList![safeImmersiveIndex]! : null;
  const immersiveSrc = immersiveItem?.clipSrc ?? '';
  const playlistLen = immersiveList?.length ?? 0;

  useEffect(() => {
    if (activePlayIndex === null) return;
    setClipNonce((n) => n + 1);
  }, [activePlayIndex]);

  const closeImmersive = useCallback(() => {
    hadNativeFullscreenRef.current = false;
    immersiveOpenRef.current = false;
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

  useLayoutEffect(() => {
    if (immersiveList === null) {
      immersiveOpenRef.current = false;
      return;
    }
    const isFirstOpen = !immersiveOpenRef.current;
    immersiveOpenRef.current = true;
    if (!isFirstOpen) return;
    const el = immersiveShellRef.current;
    if (!el) return;
    hadNativeFullscreenRef.current = false;
    void requestElFullscreen(el)
      .then(() => {
        hadNativeFullscreenRef.current = true;
      })
      .catch(() => {
        hadNativeFullscreenRef.current = false;
      });
  }, [immersiveList]);

  useEffect(() => {
    if (immersiveList === null) return;
    const onFs = () => {
      if (document.fullscreenElement === null && hadNativeFullscreenRef.current) {
        hadNativeFullscreenRef.current = false;
        immersiveOpenRef.current = false;
        setImmersiveList(null);
        setImmersiveIndex(0);
      }
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, [immersiveList]);

  useEffect(() => {
    if (immersiveList === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeImmersive();
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowLeft') {
        goImmersivePrev();
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowRight') {
        goImmersiveNext();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [immersiveList, closeImmersive, goImmersivePrev, goImmersiveNext]);

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
    if (immersiveList === null) {
      return;
    }
    const v = immersiveVideoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.muted = false;
    void v.play().catch(() => {
      v.muted = true;
      void v.play().catch(() => {});
    });
  }, [immersiveList, safeImmersiveIndex, immersiveSrc]);

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

  const immersiveNode =
    immersiveItem && inImmersive ? (
      <div
        ref={immersiveShellRef}
        className="fixed inset-0 z-[300] flex h-[100dvh] w-full flex-col bg-black/75 text-white"
        role="dialog"
        aria-modal="true"
        aria-label="Expanded video"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-2 py-2 sm:px-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/35 bg-white/10 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            aria-label="Share"
            onClick={(e) => e.stopPropagation()}
          >
            <Icons.Share className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            onClick={closeImmersive}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            aria-label="Close"
          >
            <Icons.Close className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 items-stretch justify-center gap-1 px-1 sm:gap-2 sm:px-3">
          <button
            type="button"
            disabled={safeImmersiveIndex <= 0}
            onClick={goImmersivePrev}
            className="my-auto inline-flex h-12 w-10 shrink-0 items-center justify-center rounded-lg text-white/90 enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous video"
          >
            <ChevronLeft className="h-8 w-8" strokeWidth={1.5} />
          </button>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center py-2">
            <video
              ref={immersiveVideoRef}
              key={immersiveSrc}
              className="max-h-[min(70dvh,100%)] w-full max-w-4xl object-contain"
              src={immersiveSrc}
              playsInline
              controls
              autoPlay
            />
          </div>
          <button
            type="button"
            disabled={safeImmersiveIndex >= playlistLen - 1}
            onClick={goImmersiveNext}
            className="my-auto inline-flex h-12 w-10 shrink-0 items-center justify-center rounded-lg text-white/90 enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next video"
          >
            <ChevronRight className="h-8 w-8" strokeWidth={1.5} />
          </button>
        </div>
        <div className="shrink-0 border-t border-white/10 bg-black/30 px-4 py-3 sm:px-6 sm:py-4">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs text-white/50 sm:text-sm">
              {playlistLen > 0 ? `Clip ${safeImmersiveIndex + 1} of ${playlistLen}` : null}
            </p>
            <div className="mt-1 sm:mt-2">
              <FeedVideoClipReelInfo item={immersiveItem.item} size="comfortable" />
            </div>
          </div>
        </div>
      </div>
    ) : null;

  const sectionAria =
    props.mode === 'saved'
      ? 'Saved video clips'
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
                Nothing saved yet. Save clips from the feed to see them here.
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
