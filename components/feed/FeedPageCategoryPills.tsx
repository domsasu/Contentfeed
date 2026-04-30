import React, { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import {
  Brackets,
  Briefcase,
  FlaskConical,
  Paintbrush,
  Rocket,
  ShieldPlus,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { FEED_PAGE_CATEGORY_CHIPS } from '../../constants/feedPageCategories';
import { Icons } from '../Icons';

const ICON_BY_SLUG: Record<string, LucideIcon> = {
  'physical-science-and-engineering': FlaskConical,
  business: Briefcase,
  'arts-and-humanities': Paintbrush,
  'social-sciences': Users,
  health: ShieldPlus,
  'data-science': TrendingUp,
  'personal-development': Rocket,
  'computer-science': Brackets,
};

const popularPillClasses = (active: boolean) =>
  `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0056d2] focus-visible:ring-offset-2 ${
    active
      ? 'border-[#1f2937] bg-[#1f2937] text-white shadow-sm'
      : 'border-[#e5e7eb] bg-white text-[#1a1a1a] hover:border-slate-300'
  }`;

export interface FeedPageCategoryPillsProps {
  /** `null` = all categories (no discipline filter). */
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
  /** Opens the liked-videos library page. */
  onOpenSavedLibrary?: () => void;
  /** Increment when user likes a clip; plays a short header icon motion. */
  headerBookmarkSaveTick?: number;
  /** Main title next to the like icon (e.g. “Liked videos” on the library route). */
  pageTitle?: string;
  /** When true, the like icon is filled and the control reflects “on Liked videos”. */
  savedPageActive?: boolean;
  /** Renders a chevron back control to the left of the title (e.g. return to feed from liked videos). */
  onBack?: () => void;
  /** When false, the category tab row is omitted (saved library only). */
  showCategoryTabs?: boolean;
}

/**
 * "Explore Categories" page title + category filter row for the full Feed page.
 */
export const FeedPageCategoryPills: React.FC<FeedPageCategoryPillsProps> = ({
  selectedSlug,
  onSelect,
  onOpenSavedLibrary,
  headerBookmarkSaveTick = 0,
  pageTitle = 'Explore Categories',
  savedPageActive = false,
  onBack,
  showCategoryTabs = true,
}) => {
  const [vibrate, setVibrate] = useState(false);

  useEffect(() => {
    if (headerBookmarkSaveTick < 1) return;
    setVibrate(true);
    const t = window.setTimeout(() => setVibrate(false), 500);
    return () => clearTimeout(t);
  }, [headerBookmarkSaveTick]);

  return (
    <div className="mb-6 md:mb-8">
      <div
        className={`flex items-start justify-between gap-3 ${showCategoryTabs ? 'mb-5 md:mb-6' : ''}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[var(--cds-color-grey-800)] shadow-none transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-700)] focus-visible:ring-offset-2"
              aria-label="Back to explore feed"
              title="Back to explore feed"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={2} aria-hidden />
            </button>
          ) : null}
          <h1 className="min-w-0 text-left text-2xl font-bold tracking-tight text-[#1a1a1a] md:text-3xl">
            {pageTitle}
          </h1>
        </div>
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => onOpenSavedLibrary?.()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-[var(--cds-color-grey-800)] shadow-none transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-700)] focus-visible:ring-offset-2"
            aria-label="Liked videos"
            title="Liked videos"
            aria-pressed={savedPageActive}
          >
            <Icons.Like
              className={`h-5 w-5 shrink-0 ${savedPageActive ? 'fill-[var(--cds-color-grey-800)]' : 'fill-none'} ${vibrate ? 'animate-bookmark-vibrate' : ''}`}
              strokeWidth={2}
              aria-hidden
            />
          </button>
        </div>
      </div>
      {showCategoryTabs ? (
        <div
          role="tablist"
          aria-label="Feed categories"
          className="flex w-full min-w-0 flex-wrap items-center gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedSlug === null}
            className={popularPillClasses(selectedSlug === null)}
            onClick={() => onSelect(null)}
          >
            All
          </button>
          {FEED_PAGE_CATEGORY_CHIPS.map(({ slug, label }) => {
            const Icon = ICON_BY_SLUG[slug] ?? Brackets;
            const active = selectedSlug === slug;
            return (
              <button
                key={slug}
                type="button"
                role="tab"
                aria-selected={active}
                className={popularPillClasses(active)}
                onClick={() => onSelect(slug)}
              >
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 stroke-[1.75] ${
                    active ? 'text-white' : 'text-[#6b7280]'
                  }`}
                  aria-hidden
                />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
