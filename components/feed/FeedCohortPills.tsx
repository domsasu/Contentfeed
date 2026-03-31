import React from 'react';
import {
  Brackets,
  Briefcase,
  FlaskConical,
  Globe,
  Grid3x3,
  Laptop,
  LayoutGrid,
  Paintbrush,
  Rocket,
  ShieldPlus,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { COURSERA_BROWSE_DISCIPLINES } from '../../constants/feedCohorts';

/** Icons aligned with Coursera browse category pills (coursera.org). */
const DISCIPLINE_ICON_BY_SLUG: Record<string, LucideIcon> = {
  'arts-and-humanities': Paintbrush,
  business: Briefcase,
  'computer-science': Brackets,
  'data-science': TrendingUp,
  health: ShieldPlus,
  'information-technology': Laptop,
  'language-learning': Globe,
  'math-and-logic': Grid3x3,
  'personal-development': Rocket,
  'physical-science-and-engineering': FlaskConical,
  'social-sciences': Users,
};

interface FeedCohortPillsProps {
  /** `null` = no career-area filter (cohort feed only). */
  activeSlug: string | null;
  onSelectSlug: (slug: string | null) => void;
  /** Tighter pills for narrow rails. */
  compact?: boolean;
  /** Coursera.com-style pale blue capsules + icon + label (top feed bar). */
  variant?: 'default' | 'coursera';
}

const pillClassesDefault = (active: boolean, compact: boolean) =>
  `shrink-0 rounded-[var(--cds-border-radius-400)] font-medium leading-tight transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cds-color-blue-700)] focus-visible:ring-offset-1 ${
    compact ? 'px-1.5 py-px text-[11px]' : 'px-2 py-0.5 text-xs'
  } ${
    active
      ? 'bg-[var(--cds-color-grey-800)] text-[var(--cds-color-white)]'
      : 'border border-[var(--cds-color-grey-100)] bg-[var(--cds-color-white)] text-[var(--cds-color-grey-800)] hover:bg-[var(--cds-color-grey-25)]'
  }`;

const courseraPillClasses = (active: boolean) =>
  `inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0056d2] focus-visible:ring-offset-2 ${
    active
      ? 'border-[#0056d2] bg-[#d2e7fb] text-[#0d1f3c] shadow-sm'
      : 'border-[#dcecf9] bg-[#e8f4fd] text-[#232323] hover:bg-[#ddeef9]'
  }`;

/** Coursera.org browse career areas — independent of cohort membership. */
export const FeedCohortPills: React.FC<FeedCohortPillsProps> = ({
  activeSlug,
  onSelectSlug,
  compact = false,
  variant = 'default',
}) => {
  const isCoursera = variant === 'coursera';

  return (
    <div
      className={
        isCoursera
          ? 'min-w-0 flex-1'
          : 'min-w-0 flex-1 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
      }
    >
      <div
        role="tablist"
        aria-label="Feed scope and Coursera discipline filters"
        className={
          isCoursera
            ? 'flex w-full min-w-0 flex-wrap items-center gap-2 py-0.5'
            : `flex w-max max-w-none flex-nowrap items-center ${compact ? 'gap-1' : 'gap-1.5 py-1'} py-0.5`
        }
      >
        {isCoursera ? (
          <button
            key="__all_disciplines__"
            type="button"
            role="tab"
            aria-selected={activeSlug === null}
            className={courseraPillClasses(activeSlug === null)}
            onClick={() => onSelectSlug(null)}
          >
            <LayoutGrid className="h-4 w-4 shrink-0 stroke-[1.75] text-current opacity-90" aria-hidden />
            <span>All</span>
          </button>
        ) : null}
        {COURSERA_BROWSE_DISCIPLINES.map(({ slug, label }) => {
          const Icon = DISCIPLINE_ICON_BY_SLUG[slug] ?? Globe;
          const selected = activeSlug === slug;

          return (
            <button
              key={slug}
              type="button"
              role="tab"
              aria-selected={selected}
              className={
                isCoursera ? courseraPillClasses(selected) : pillClassesDefault(selected, compact)
              }
              onClick={() =>
                isCoursera ? onSelectSlug(selected ? null : slug) : onSelectSlug(slug)
              }
            >
              {isCoursera ? (
                <>
                  <Icon className="h-4 w-4 shrink-0 stroke-[1.75] text-current opacity-90" aria-hidden />
                  <span>{label}</span>
                </>
              ) : (
                label
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
