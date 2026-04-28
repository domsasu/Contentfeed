import React, { useCallback, useEffect, useRef } from 'react';
import { Icons } from '../Icons';
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
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex justify-center gap-2.5 bg-gradient-to-t from-black/45 to-transparent px-2 pb-2.5 pt-8 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        <button
          type="button"
          className="pointer-events-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/35 bg-black/55 text-white shadow-sm backdrop-blur-[2px] transition-colors hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Like"
          onClick={(e) => e.stopPropagation()}
        >
          <Icons.Like className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          className="pointer-events-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/35 bg-black/55 text-white shadow-sm backdrop-blur-[2px] transition-colors hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Share"
          onClick={(e) => e.stopPropagation()}
        >
          <Icons.Share className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
        </button>
      </div>
      <div className="pointer-events-none absolute inset-0 z-[2] flex items-start justify-end p-2 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
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

