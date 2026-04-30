import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Minimize2, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import type { FeedPlaceholderItem } from '../../constants/feedCohorts';
import { getFeedVideoClipReelModel } from './feedVideoClipReelModel';
import type { ImmersiveClip } from './feedImmersiveShared';
import { Icons } from '../Icons';

const SKIP_SEC = 10;

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function FeedTheaterDetailPanel({ item }: { item: FeedPlaceholderItem }) {
  const m = item.type === 'video' ? getFeedVideoClipReelModel(item) : null;
  const header = m?.entityName ?? item.title;
  const captionHint = m?.caption;
  const mark = m?.avatarChar ?? 'C';

  return (
    <div className="flex h-full min-h-0 flex-col bg-black p-4 text-left md:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-sm font-bold text-white"
          aria-hidden
        >
          {mark}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6ea8ff]">Coursera</p>
          <p className="text-[11px] text-white/50">Learn without limits</p>
        </div>
      </div>
      <h2 className="text-lg font-bold leading-snug text-white md:text-xl">{header}</h2>
      {item.subtitle ? (
        <p className="mt-2 text-sm leading-relaxed text-white/75">{item.subtitle}</p>
      ) : null}
      {item.meta ? (
        <p className="mt-2 text-xs text-white/45">{item.meta}</p>
      ) : null}
      {captionHint && captionHint !== item.subtitle ? (
        <p className="mt-4 text-sm leading-relaxed text-white/60">{captionHint}</p>
      ) : null}
    </div>
  );
}

export interface FeedTheaterImmersiveProps {
  clips: ImmersiveClip[];
  activeIndex: number;
  onPrevClip: () => void;
  onNextClip: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  onClose: () => void;
}

/**
 * Coursera-style theater: video column + custom transport, right rail with brand + copy.
 * Viewport overlay only (no Fullscreen API). Keyboard: Space play/pause, arrows ±10s seek,
 * Shift+arrows prev/next clip, Escape close.
 */
export const FeedTheaterImmersive: React.FC<FeedTheaterImmersiveProps> = ({
  clips,
  activeIndex,
  onPrevClip,
  onNextClip,
  canGoPrev,
  canGoNext,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const minimizeRef = useRef<HTMLButtonElement>(null);
  const seekTrackRef = useRef<HTMLDivElement>(null);
  const seekDraggingRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const clip = clips[activeIndex];
  const src = clip?.clipSrc ?? '';
  const item = clip?.item;

  const syncFromVideo = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setPaused(v.paused);
    setMuted(v.muted);
    setCurrentTime(v.currentTime);
    const d = v.duration;
    setDuration(Number.isFinite(d) && d > 0 ? d : 0);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;
    seekDraggingRef.current = false;
    v.currentTime = 0;
    setCurrentTime(0);
    setDuration(0);
    v.muted = false;
    setMuted(false);
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    const onVolume = () => setMuted(v.muted);
    const onMeta = () => {
      const d = v.duration;
      setDuration(Number.isFinite(d) && d > 0 ? d : 0);
    };
    const onSeeked = () => {
      if (!seekDraggingRef.current) setCurrentTime(v.currentTime);
    };
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('volumechange', onVolume);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('durationchange', onMeta);
    v.addEventListener('seeked', onSeeked);
    void v.play().catch(() => {
      v.muted = true;
      setMuted(true);
      void v.play().catch(() => {});
    });
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('volumechange', onVolume);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('durationchange', onMeta);
      v.removeEventListener('seeked', onSeeked);
    };
  }, [src, activeIndex]);

  /** Smooth progress bar while playing (no native range thumb). */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;
    let raf = 0;
    const tick = () => {
      if (!seekDraggingRef.current) {
        setCurrentTime(v.currentTime);
        const d = v.duration;
        if (Number.isFinite(d) && d > 0) {
          setDuration((prev) => (Math.abs(prev - d) > 0.05 ? d : prev));
        }
      }
      if (!v.paused) {
        raf = requestAnimationFrame(tick);
      }
    };
    const start = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (!seekDraggingRef.current) setCurrentTime(v.currentTime);
    };
    const onSeeking = () => {
      if (!seekDraggingRef.current) setCurrentTime(v.currentTime);
    };
    v.addEventListener('play', start);
    v.addEventListener('pause', stop);
    v.addEventListener('seeking', onSeeking);
    if (!v.paused) start();
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener('play', start);
      v.removeEventListener('pause', stop);
      v.removeEventListener('seeking', onSeeking);
    };
  }, [src, activeIndex]);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReduced) {
      minimizeRef.current?.focus();
      return;
    }
    const t = window.setTimeout(() => minimizeRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
    syncFromVideo();
  }, [syncFromVideo]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    syncFromVideo();
  }, [syncFromVideo]);

  const seekBy = useCallback(
    (delta: number) => {
      const v = videoRef.current;
      if (!v) return;
      const d = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : duration;
      const next = d > 0 ? Math.max(0, Math.min(d, v.currentTime + delta)) : Math.max(0, v.currentTime + delta);
      v.currentTime = next;
      setCurrentTime(next);
    },
    [duration]
  );

  const onScrub = useCallback((next: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = next;
    setCurrentTime(next);
  }, []);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const track = seekTrackRef.current;
      const v = videoRef.current;
      if (!track || !v) return;
      const d = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : duration;
      if (d <= 0) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const t = ratio * d;
      v.currentTime = t;
      setCurrentTime(t);
    },
    [duration]
  );

  const onSeekPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const track = seekTrackRef.current;
      if (!track || duration <= 0) return;
      seekDraggingRef.current = true;
      track.setPointerCapture(e.pointerId);
      seekFromClientX(e.clientX);
    },
    [duration, seekFromClientX]
  );

  const onSeekPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!seekDraggingRef.current) return;
      seekFromClientX(e.clientX);
    },
    [seekFromClientX]
  );

  const onSeekPointerUp = useCallback((e: React.PointerEvent) => {
    if (!seekDraggingRef.current) return;
    seekDraggingRef.current = false;
    const track = seekTrackRef.current;
    if (track?.hasPointerCapture(e.pointerId)) {
      track.releasePointerCapture(e.pointerId);
    }
    const v = videoRef.current;
    if (v) setCurrentTime(v.currentTime);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        e.preventDefault();
        return;
      }
      const t = e.target as HTMLElement;
      if (t instanceof Element && t.closest('[data-theater-seek-track]')) return;

      if (e.key === ' ' || e.code === 'Space') {
        if (t instanceof Element && t.closest('button, input, textarea, [role="slider"], [data-theater-seek-track]'))
          return;
        e.preventDefault();
        togglePlay();
        return;
      }
      if (e.key === 'ArrowLeft') {
        if (e.shiftKey) {
          if (canGoPrev) onPrevClip();
          e.preventDefault();
        } else {
          seekBy(-SKIP_SEC);
          e.preventDefault();
        }
        return;
      }
      if (e.key === 'ArrowRight') {
        if (e.shiftKey) {
          if (canGoNext) onNextClip();
          e.preventDefault();
        } else {
          seekBy(SKIP_SEC);
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose, togglePlay, seekBy, canGoPrev, canGoNext, onPrevClip, onNextClip]);

  if (!item || !clip) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex h-[100dvh] w-full flex-col bg-[#0a0a0a] text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Theater video"
    >
      <div className="flex shrink-0 items-center justify-end border-b border-white/10 px-2 py-2 sm:px-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          aria-label="Close"
          title="Close"
        >
          <Icons.Close className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row md:items-stretch">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-black md:max-w-[70%] md:flex-[1.1]">
          <div className="flex min-h-0 min-w-0 flex-1 items-center gap-1 px-1 py-2 sm:gap-2 sm:px-3">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={onPrevClip}
              className="inline-flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30 sm:h-12 sm:w-10"
              aria-label="Previous video"
            >
              <ChevronLeft className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.5} />
            </button>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center">
              <video
                ref={videoRef}
                key={src}
                className="max-h-[min(52dvh,100%)] w-full object-contain md:max-h-[min(72dvh,100%)]"
                src={src}
                playsInline
                autoPlay
                onClick={togglePlay}
                aria-label="Video"
              />
            </div>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={onNextClip}
              className="inline-flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30 sm:h-12 sm:w-10"
              aria-label="Next video"
            >
              <ChevronRight className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.5} />
            </button>
          </div>

          <div className="shrink-0 w-full border-t border-white/10 bg-black/80">
            <div className="w-full px-2 pt-2 sm:px-4 sm:pt-2.5">
              <span className="sr-only" id="theater-seek-label">
                Seek
              </span>
              <div
                ref={seekTrackRef}
                data-theater-seek-track
                role="slider"
                tabIndex={duration > 0 ? 0 : -1}
                aria-labelledby="theater-seek-label"
                aria-valuemin={0}
                aria-valuemax={Math.max(Math.round(duration * 1000) / 1000, 0)}
                aria-valuenow={Math.round(currentTime * 1000) / 1000}
                aria-disabled={duration <= 0}
                className="relative flex h-6 w-full cursor-pointer touch-none items-center py-2 select-none"
                onPointerDown={onSeekPointerDown}
                onPointerMove={onSeekPointerMove}
                onPointerUp={onSeekPointerUp}
                onPointerCancel={onSeekPointerUp}
                onKeyDown={(e) => {
                  if (duration <= 0) return;
                  if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    e.stopPropagation();
                    seekBy(-5);
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    e.stopPropagation();
                    seekBy(5);
                  } else if (e.key === 'Home') {
                    e.preventDefault();
                    e.stopPropagation();
                    onScrub(0);
                  } else if (e.key === 'End') {
                    e.preventDefault();
                    e.stopPropagation();
                    onScrub(duration);
                  }
                }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/20" />
                <div
                  className="pointer-events-none absolute left-0 top-1/2 h-[2px] max-w-full -translate-y-1/2 rounded-full bg-[#0056d2] will-change-[width]"
                  style={{
                    width: duration > 0 ? `${Math.min(100, Math.max(0, (currentTime / duration) * 100))}%` : '0%',
                  }}
                />
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 px-2 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
              <button
                ref={minimizeRef}
                type="button"
                data-theater-minimize
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                aria-label="Return to feed"
                title="Return to feed"
              >
                <Minimize2 className="h-4 w-4" strokeWidth={2} aria-hidden />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                aria-label={paused ? 'Play' : 'Pause'}
              >
                {paused ? (
                  <Play className="h-4 w-4 translate-x-px" fill="currentColor" aria-hidden />
                ) : (
                  <Pause className="h-4 w-4" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? (
                  <VolumeX className="h-4 w-4" strokeWidth={2} aria-hidden />
                ) : (
                  <Volume2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                )}
              </button>
              <span className="shrink-0 font-mono text-xs tabular-nums text-white/80 sm:text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <span className="ml-auto shrink-0 text-[10px] text-white/45 sm:text-xs">
                Clip {activeIndex + 1} of {clips.length}
              </span>
            </div>
          </div>
        </div>

        <div className="max-h-[40vh] min-h-0 w-full shrink-0 overflow-y-auto border-t border-white/10 bg-black md:max-h-none md:border-l md:border-t-0 md:w-[min(100%,22rem)] md:max-w-[40%] lg:w-[min(100%,26rem)]">
          <FeedTheaterDetailPanel item={item} />
        </div>
      </div>
    </div>
  );
};
