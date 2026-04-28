import React from 'react';
import {
  Brackets,
  Briefcase,
  FlaskConical,
  LayoutGrid,
  Paintbrush,
  Rocket,
  ShieldPlus,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { FEED_PAGE_CATEGORY_CHIPS } from '../../constants/feedPageCategories';

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

const pillClasses = (pressed: boolean) =>
  `inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0056d2] focus-visible:ring-offset-2 ${
    pressed
      ? 'border-[#0056d2] bg-[#d2e7fb] text-[#0d1f3c] shadow-sm'
      : 'border-[#dcecf9] bg-[#e8f4fd] text-[#232323] hover:bg-[#ddeef9]'
  }`;

export interface FeedPageCategoryPillsProps {
  /** `null` = all categories (no discipline filter). */
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
}

/**
 * Top category row for the full Feed page (single-select + All).
 */
export const FeedPageCategoryPills: React.FC<FeedPageCategoryPillsProps> = ({
  selectedSlug,
  onSelect,
}) => {
  const allActive = selectedSlug === null;

  return (
    <div
      role="tablist"
      aria-label="Feed categories"
      className="mb-5 flex w-full min-w-0 flex-wrap items-center gap-2"
    >
      <button
        type="button"
        role="tab"
        aria-selected={allActive}
        className={pillClasses(allActive)}
        onClick={() => onSelect(null)}
      >
        <LayoutGrid className="h-4 w-4 shrink-0 stroke-[1.75] text-current opacity-90" aria-hidden />
        <span>All</span>
      </button>
      {FEED_PAGE_CATEGORY_CHIPS.map(({ slug, label }) => {
        const Icon = ICON_BY_SLUG[slug] ?? Brackets;
        const pressed = selectedSlug === slug;
        return (
          <button
            key={slug}
            type="button"
            role="tab"
            aria-selected={pressed}
            className={pillClasses(pressed)}
            onClick={() => onSelect(slug)}
          >
            <Icon className="h-4 w-4 shrink-0 stroke-[1.75] text-current opacity-90" aria-hidden />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};
