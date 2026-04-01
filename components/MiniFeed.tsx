/**
 * Mini feed — compact Home preview of the user’s first joined cohort (videos/podcasts only, no articles).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FEED_COHORT_META,
  JOINED_FEED_COHORT_IDS,
  getFeedPlaceholderItems,
  type FeedCohortId,
  type FeedPlaceholderItem,
} from '../constants/feedCohorts';
import { pickRandomMiniFeedThumbnailUrl } from '../constants/miniFeedVideoThumbnails';
import { Icons } from './Icons';

const PAGE_SIZE = 3;
const MAX_MINI_FEED_ITEMS = 9;

/** 16:9 media frame — shared by video raster thumbs and podcast cover so tiles stay consistent. */
const MINI_FEED_MEDIA_FRAME =
  'relative aspect-video w-full shrink-0 overflow-hidden rounded-[var(--cds-border-radius-50)] bg-[var(--cds-color-grey-100)]';

/** Coursera Podcast cover art (square); used in place of generic placeholders for podcast rows. */
export const MINI_FEED_PODCAST_COVER_SRC = '/feed/coursera-podcast-cover.png';

/** Stable pseudo-random duration 0:01–2:00 for mini-feed video rows (preview cap messaging). */
function miniFeedVideoDurationLabel(stableKey: string): string {
  let h = 2166136261;
  for (let i = 0; i < stableKey.length; i++) {
    h ^= stableKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const totalSec = 1 + ((h >>> 0) % 120);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Random still from `public/thumbnails/` per tile (ref avoids Strict Mode double-pick in dev). */
const MiniFeedVideoRasterThumb: React.FC = () => {
  const urlRef = useRef<string | null>(null);
  if (urlRef.current === null) {
    urlRef.current = pickRandomMiniFeedThumbnailUrl();
  }
  return (
    <img
      src={urlRef.current}
      alt=""
      className="h-full w-full object-cover object-center"
      loading="lazy"
      decoding="async"
    />
  );
};

interface PodcastMiniThumbProps {
  audioUrl?: string;
  rowKey: string;
  activeKey: string | null;
  setActiveKey: (key: string | null) => void;
}

const PodcastMiniThumb: React.FC<PodcastMiniThumbProps> = ({
  audioUrl,
  rowKey,
  activeKey,
  setActiveKey,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const isActive = activeKey === rowKey;

  useEffect(() => {
    if (!isActive) {
      audioRef.current?.pause();
      setPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setActiveKey(null);
    };
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);
    return () => {
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded);
    };
  }, [setActiveKey]);

  const toggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!audioUrl) return;
      const a = audioRef.current;
      if (!a) return;
      if (playing) {
        a.pause();
        setPlaying(false);
        setActiveKey(null);
        return;
      }
      setActiveKey(rowKey);
      void a.play().catch(() => {
        setPlaying(false);
        setActiveKey(null);
      });
    },
    [audioUrl, playing, rowKey, setActiveKey]
  );

  const canPlay = Boolean(audioUrl);

  const playBtn =
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--cds-color-white)] text-[var(--cds-color-blue-700)] shadow-md transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-white)] focus-visible:ring-offset-2 focus-visible:ring-offset-black/50';

  return (
    <div className={`group ${MINI_FEED_MEDIA_FRAME}`}>
      <img
        src={MINI_FEED_PODCAST_COVER_SRC}
        alt=""
        className="h-full w-full object-cover object-center"
        loading="lazy"
        decoding="async"
      />
      {canPlay ? (
        <>
          <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
              playing
                ? 'bg-black/35 opacity-100'
                : 'pointer-events-none bg-black/40 opacity-0 group-hover:pointer-events-auto group-hover:opacity-100'
            }`}
          >
            <button
              type="button"
              onClick={toggle}
              className={playBtn}
              aria-label={playing ? 'Pause podcast' : 'Play podcast'}
            >
              {playing ? (
                <Icons.Pause className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              ) : (
                <Icons.Play className="h-5 w-5 shrink-0 translate-x-px" strokeWidth={1.75} aria-hidden />
              )}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
};

export interface MiniFeedProps {
  onOpenFeed: () => void;
}

export const MiniFeed: React.FC<MiniFeedProps> = ({ onOpenFeed }) => {
  const firstCohortId: FeedCohortId = JOINED_FEED_COHORT_IDS[0] ?? 'careerswitchers';
  const cohortMeta = FEED_COHORT_META[firstCohortId];

  /** Video + podcast only, up to 9, pooled across joined cohorts so three pages of three are possible. */
  const allItems = useMemo(() => {
    const out: FeedPlaceholderItem[] = [];
    for (const id of JOINED_FEED_COHORT_IDS) {
      for (const item of getFeedPlaceholderItems(id, {})) {
        if (item.type === 'article') continue;
        if (out.length >= MAX_MINI_FEED_ITEMS) return out;
        out.push(item);
      }
    }
    return out;
  }, []);

  const pageCount = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));
  const [pageIndex, setPageIndex] = useState(0);
  const safePage = Math.min(pageIndex, pageCount - 1);
  const items = allItems.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const [activePodcastKey, setActivePodcastKey] = useState<string | null>(null);

  useEffect(() => {
    setActivePodcastKey(null);
  }, [safePage]);

  useEffect(() => {
    setPageIndex((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  return (
    <section
      className="rounded-[var(--cds-border-radius-200)] bg-[var(--cds-color-white)] p-4 sm:p-5 text-left"
      aria-label={`Feed for ${cohortMeta.label}. Use See all to open the full feed.`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="cds-subtitle-lg text-[var(--cds-color-grey-975)]">Feed</h2>
        <button
          type="button"
          onClick={onOpenFeed}
          className="ml-auto inline-flex items-center gap-2 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-700)] focus-visible:ring-offset-2"
        >
          <span className="cds-subtitle-md text-[var(--cds-color-grey-975)]">See all</span>
          <span className="material-symbols-rounded text-[var(--cds-color-grey-600)]" style={{ fontSize: '20px' }}>
            arrow_forward
          </span>
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-5">
        <div className="flex shrink-0 flex-col items-center justify-center gap-2 border-b border-[var(--cds-color-grey-100)] pb-4 text-center sm:w-40 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-5 md:w-44">
          <p className="cds-body-secondary max-w-[12rem] text-[var(--cds-color-grey-800)]">
            Interest in your cohort
          </p>
          <span className="cds-body-tertiary rounded-[var(--cds-border-radius-400)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-grey-25)] px-2 py-0.5 text-[var(--cds-color-grey-700)]">
            {cohortMeta.pillLabel}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="grid min-w-0 flex-1 grid-cols-1 items-stretch gap-3 sm:grid-cols-3 sm:gap-4">
            {items.map((item, i) => {
              const globalIndex = safePage * PAGE_SIZE + i;
              const rowKey = `mini-${globalIndex}-${item.type}-${item.title.slice(0, 32)}`;
              const openRow = () => onOpenFeed();

              const tileBase =
                'flex h-full min-w-0 flex-col gap-3 rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-grey-25)] p-4 sm:p-5 text-left transition-colors hover:border-[var(--cds-color-grey-200)] hover:bg-[var(--cds-color-grey-50)]';

              if (item.type === 'podcast') {
                return (
                  <article key={rowKey} className={tileBase}>
                    <PodcastMiniThumb
                      audioUrl={item.podcastAudioUrl}
                      rowKey={rowKey}
                      activeKey={activePodcastKey}
                      setActiveKey={setActivePodcastKey}
                    />
                    <button
                      type="button"
                      onClick={openRow}
                      className="flex min-h-0 flex-1 flex-col justify-end rounded-[var(--cds-border-radius-50)] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-700)] focus-visible:ring-offset-2"
                    >
                      <p className="cds-body-tertiary mb-1 text-[var(--cds-color-grey-600)]">{item.meta}</p>
                      <p className="cds-body-secondary line-clamp-2 text-[var(--cds-color-grey-975)] hover:text-[var(--cds-color-blue-800)]">
                        {item.title}
                      </p>
                    </button>
                  </article>
                );
              }

              return (
                <button
                  key={rowKey}
                  type="button"
                  onClick={openRow}
                  className={`${tileBase} focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-700)] focus-visible:ring-offset-2`}
                >
                  <div className={MINI_FEED_MEDIA_FRAME}>
                    <MiniFeedVideoRasterThumb />
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col justify-end">
                    <p
                      className="cds-body-tertiary mb-1 text-[var(--cds-color-grey-600)]"
                      title="Mini preview clips play up to 2 minutes"
                    >
                      Video
                      <span className="text-[var(--cds-color-grey-400)]"> · </span>
                      {miniFeedVideoDurationLabel(rowKey)}
                      <span className="text-[var(--cds-color-grey-400)]"> · </span>
                      ≤2 min
                    </p>
                    <p className="cds-body-secondary line-clamp-2 text-[var(--cds-color-grey-975)]">{item.title}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {pageCount > 1 ? (
            <div className="flex gap-2" role="navigation" aria-label="Feed pages">
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
      </div>
    </section>
  );
};
