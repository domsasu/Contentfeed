import React, { useMemo, useState } from 'react';
import { Icons } from '../Icons';
import type { FeedPlaceholderItem, FeedPlaceholderMediaType } from '../../constants/feedCohorts';

interface FeedMediaCardProps {
  item: FeedPlaceholderItem;
}

function stableHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function engagementMetrics(type: FeedPlaceholderMediaType, title: string): { cheer: number; share: number } {
  const h = stableHash(`${type}\0${title}`);
  const pick = (min: number, max: number, rot: number) => {
    const span = max - min + 1;
    return min + Math.floor((h >>> rot) % span);
  };
  switch (type) {
    case 'video':
      return { cheer: pick(340, 5200, 0), share: pick(12, 890, 9) };
    case 'article':
      return { cheer: pick(28, 2100, 0), share: pick(2, 156, 9) };
    case 'podcast':
      return { cheer: pick(510, 12000, 0), share: pick(22, 1200, 9) };
  }
}

function formatEngagementCount(n: number): string {
  if (n >= 10000) return `${Math.round(n / 1000)}K`;
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 < 0.05 ? `${Math.floor(k)}K` : `${k.toFixed(1).replace(/\.0$/, '')}K`;
  }
  return n.toLocaleString();
}

export const FeedMediaCard: React.FC<FeedMediaCardProps> = ({ item }) => {
  const { type, title, subtitle, meta, thumbnailUrl, thumbnailAttribution, thumbnailAttributionUrl } =
    item;
  const { cheer, share } = useMemo(() => engagementMetrics(type, title), [type, title]);
  const [cheered, setCheered] = useState(false);
  const [cheerBurstKey, setCheerBurstKey] = useState(0);
  const [cheerPopKey, setCheerPopKey] = useState(0);
  const displayedCheer = cheer + (cheered ? 1 : 0);

  return (
    <article className="rounded-[var(--cds-border-radius-200)] border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-md bg-[var(--cds-color-grey-50)] px-2 py-0.5 cds-body-tertiary text-xs font-semibold uppercase tracking-wide text-[var(--cds-color-grey-600)]">
          {type === 'video' ? 'Video' : type === 'article' ? 'Article' : 'Coursera podcast'}
        </span>
        <span className="cds-body-tertiary text-[var(--cds-color-grey-500)]">{meta}</span>
      </div>

      {type === 'video' && (
        <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-lg bg-[var(--cds-color-grey-100)]">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : null}
          <div
            className={`absolute inset-0 flex items-center justify-center ${
              thumbnailUrl ? 'bg-[var(--cds-color-grey-975)]/40' : 'bg-[var(--cds-color-grey-200)]/80'
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--cds-color-grey-975)] text-[var(--cds-color-white)] shadow-md">
              <Icons.Play className="h-7 w-7 translate-x-0.5" />
            </div>
          </div>
          {thumbnailAttribution && thumbnailAttributionUrl ? (
            <div className="pointer-events-auto absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-2 pt-10">
              <a
                href={thumbnailAttributionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cds-body-tertiary block text-[11px] leading-snug text-white drop-shadow-sm hover:underline"
              >
                {thumbnailAttribution}
              </a>
            </div>
          ) : (
            <p className="absolute bottom-2 left-2 right-2 cds-body-tertiary text-xs text-[var(--cds-color-grey-700)]">
              Placeholder video thumbnail · cohort course clip
            </p>
          )}
        </div>
      )}

      {type === 'article' && (
        <div className="mb-3 flex gap-3 rounded-lg border border-dashed border-[var(--cds-color-grey-200)] bg-[var(--cds-color-grey-25)] p-3">
          <Icons.Reading className="h-10 w-10 shrink-0 text-[var(--cds-color-grey-400)]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-2 w-full max-w-[90%] rounded bg-[var(--cds-color-grey-200)]" />
            <div className="h-2 w-full max-w-[75%] rounded bg-[var(--cds-color-grey-100)]" />
            <div className="h-2 w-full max-w-[60%] rounded bg-[var(--cds-color-grey-100)]" />
          </div>
        </div>
      )}

      {type === 'podcast' && (
        <div className="mb-3 overflow-hidden rounded-lg border border-[var(--cds-color-grey-100)] bg-[#0a2540]">
          <img
            src="/feed/coursera-podcast-banner.png"
            alt="The Coursera Podcast — Podcast · Coursera"
            className="block h-auto w-full max-w-full"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <h3 className="cds-subtitle-sm min-w-0 flex-1 text-[var(--cds-color-grey-975)]">{title}</h3>
        {type === 'podcast' ? (
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-transparent p-1 text-[var(--cds-color-grey-975)] transition-colors hover:bg-[var(--cds-color-grey-100)] hover:text-[var(--cds-color-blue-700)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-500)] focus-visible:ring-offset-2"
            aria-label={`Play podcast · ${title}`}
          >
            <Icons.Play className="h-8 w-8 shrink-0 translate-x-px" strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
      </div>
      <p className="mt-1.5 cds-body-secondary text-[var(--cds-color-grey-600)] leading-relaxed">
        {subtitle}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-5 border-t border-[var(--cds-color-grey-50)] pt-3">
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 cds-body-tertiary transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-500)] focus-visible:ring-offset-2 ${
            cheered
              ? 'text-[var(--cds-color-blue-700)]'
              : 'text-[var(--cds-color-grey-600)] hover:text-[var(--cds-color-blue-700)]'
          }`}
          aria-label={`Cheer · ${formatEngagementCount(displayedCheer)}`}
          aria-pressed={cheered}
          onClick={() => {
            setCheered((was) => {
              if (was) return false;
              setCheerBurstKey((k) => k + 1);
              setCheerPopKey((k) => k + 1);
              return true;
            });
          }}
        >
          <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
            {cheerBurstKey > 0 && (
              <span key={cheerBurstKey} className="feed-like-ripple" />
            )}
            <Icons.Like
              key={cheerPopKey}
              className={`relative z-[1] h-4 w-4 ${cheerPopKey ? 'animate-feed-like-icon-pop' : ''}`}
              strokeWidth={2}
              fill={cheered ? 'currentColor' : 'none'}
              aria-hidden
            />
          </span>
          <span className="tabular-nums">{formatEngagementCount(displayedCheer)}</span>
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 cds-body-tertiary text-[var(--cds-color-grey-600)] hover:text-[var(--cds-color-blue-700)]"
          aria-label={`Share · ${formatEngagementCount(share)}`}
        >
          <Icons.Share className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <span className="tabular-nums">{formatEngagementCount(share)}</span>
        </button>
      </div>
    </article>
  );
};
