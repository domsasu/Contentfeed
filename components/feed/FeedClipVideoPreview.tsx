import React, { useCallback, useEffect, useRef } from 'react';
import { Icons } from '../Icons';
import type { FeedPlaceholderItem } from '../../constants/feedCohorts';
import { FeedVideoClipReelInfo } from './FeedVideoClipReelInfo';
import { MINI_FEED_SEGMENT_SEC } from './feedMiniLayoutConstants';

export interface FeedClipVideoPreviewProps {
  sectionActive: boolean;
  isActiveSegment: boolean;
  /** Bumps when the same slot is chosen again so the clip restarts (single-video row). */
  segmentNonce: number;
  userUnmuted: boolean;
  onToggleMute: () => void;
  src?: string;
  /** If true, timeupdate caps playback at the first `MINI_FEED_SEGMENT_SEC` (MiniFeed rotation). */
  capAtSegmentEnd?: boolean;
  /** When set, clicking the main video area (not unmute/like) opens immersive full-screen in the parent. */
  onRequestImmersive?: () => void;
  /**
   * Like toggles persisted liked videos list. Omit on surfaces where that is unavailable.
   */
  saveControl?: { saved: boolean; onToggle: () => void };
  /** Renders a Reels-style info stack (avatar, name, caption) on a bottom gradient. */
  reelInfoItem?: FeedPlaceholderItem;
}

/**
 * Muted / unmuteable inline video preview (Reels-style tile) used in MiniFeed and full Feed.
 */
export const FeedClipVideoPreview: React.FC<FeedClipVideoPreviewProps> = ({
  sectionActive,
  isActiveSegment,
  segmentNonce,
  userUnmuted,
  onToggleMute,
  src = '/videos/career-change-mini.mov',
  capAtSegmentEnd = true,
  onRequestImmersive,
  saveControl,
  reelInfoItem,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!sectionActive) {
      v.pause();
      v.currentTime = 0;
      return;
    }
    if (!isActiveSegment) {
      v.pause();
      v.currentTime = 0;
      return;
    }
    v.currentTime = 0;
    void v.play().catch(() => {});
  }, [sectionActive, isActiveSegment, segmentNonce, src]);

  const capSegment = useCallback(() => {
    if (!capAtSegmentEnd) return;
    const v = videoRef.current;
    if (!v || !sectionActive || !isActiveSegment) return;
    if (v.currentTime >= MINI_FEED_SEGMENT_SEC) {
      v.pause();
    }
  }, [sectionActive, isActiveSegment, capAtSegmentEnd]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.addEventListener('timeupdate', capSegment);
    return () => v.removeEventListener('timeupdate', capSegment);
  }, [capSegment, segmentNonce]);

  const actionButtonClassName =
    'pointer-events-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/35 bg-black/55 text-white shadow-sm backdrop-blur-[2px] transition-colors hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white';

  return (
    <>
      <video
        ref={videoRef}
        className="pointer-events-none h-full w-full object-cover object-center"
        src={src}
        playsInline
        preload="auto"
        muted={!userUnmuted}
        aria-hidden
        disablePictureInPicture
      />
      {onRequestImmersive ? (
        <button
          type="button"
          tabIndex={-1}
          className="absolute inset-0 z-[1] cursor-pointer border-0 bg-transparent p-0"
          aria-label="Open expanded video"
          onClick={(e) => {
            e.stopPropagation();
            onRequestImmersive();
          }}
        />
      ) : null}
      {reelInfoItem ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] w-full min-w-0">
          {/* Full-bleed gradient; text is inset on the right so it doesn’t sit under the action rail */}
          <div className="w-full bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-8 pb-1.5 sm:pt-10 sm:pb-2">
            {/*
              Match right inset to the action rail: right-1.5|sm:right-2 + 40px (w-10) + sliver of gap, so
              copy uses full width up to the rail (mini feed + main feed).
            */}
            <div className="w-full min-w-0 pl-2.5 pr-[calc(0.375rem+2.5rem+0.25rem)] sm:pl-3 sm:pr-[calc(0.5rem+2.5rem+0.25rem)]">
              <FeedVideoClipReelInfo item={reelInfoItem} size="compact" />
            </div>
          </div>
        </div>
      ) : null}
      {reelInfoItem && saveControl ? (
        <div className="pointer-events-none absolute bottom-32 right-1.5 z-[3] flex flex-col items-center gap-2.5 translate-y-[30pt] sm:bottom-36 sm:right-2 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
          <button
            type="button"
            className={actionButtonClassName}
            aria-pressed={saveControl.saved}
            aria-label={
              saveControl.saved ? 'Unlike and remove from liked videos' : 'Like video and add to liked videos'
            }
            onClick={(e) => {
              e.stopPropagation();
              saveControl.onToggle();
            }}
          >
            <Icons.Like
              className={`h-5 w-5 shrink-0 ${saveControl.saved ? 'fill-white' : 'fill-none'}`}
              strokeWidth={2}
              aria-hidden
            />
          </button>
        </div>
      ) : !reelInfoItem && saveControl ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex justify-center gap-2.5 bg-gradient-to-t from-black/45 to-transparent px-2 pb-2.5 pt-8 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
          <button
            type="button"
            className={actionButtonClassName}
            aria-pressed={saveControl.saved}
            aria-label={
              saveControl.saved ? 'Unlike and remove from liked videos' : 'Like video and add to liked videos'
            }
            onClick={(e) => {
              e.stopPropagation();
              saveControl.onToggle();
            }}
          >
            <Icons.Like
              className={`h-5 w-5 shrink-0 ${saveControl.saved ? 'fill-white' : 'fill-none'}`}
              strokeWidth={2}
              aria-hidden
            />
          </button>
        </div>
      ) : null}
      <div className="pointer-events-none absolute right-0 top-0 z-[4] p-2 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        <button
          type="button"
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-black/55 px-2.5 py-1.5 text-[var(--cds-color-white)] shadow-sm backdrop-blur-[2px] transition-colors hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          aria-label={userUnmuted ? 'Mute preview clip' : 'Unmute preview clip'}
        >
          {userUnmuted ? (
            <Icons.VolumeX className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          ) : (
            <Icons.Volume className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          )}
          <span className="text-xs font-medium leading-none text-white">
            {userUnmuted ? 'Mute' : 'Unmute'}
          </span>
        </button>
      </div>
    </>
  );
};

