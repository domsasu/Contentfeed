import React from 'react';
import type { FeedPlaceholderItem } from '../../constants/feedCohorts';
import { feedVideoTitleNeutral } from './feedVideoTitle';

const CLIP_TYPE_HREFS: Record<string, string> = {
  'Course clip': '#course-clip',
  'Instructor tip': '#instructor-tip',
};

export interface FeedVideoDescriptionLineProps {
  item: FeedPlaceholderItem;
  className?: string;
}

/**
 * Renders a feed video title with “Course clip” / “Instructor tip” as a link (rest stays plain text).
 * Used on Home mini-feed and full Feed tab.
 */
export const FeedVideoDescriptionLine: React.FC<FeedVideoDescriptionLineProps> = ({
  item,
  className = 'cds-body-secondary line-clamp-2 pl-[5pt] text-[var(--cds-color-grey-975)]',
}) => {
  const text = item.type === 'video' ? feedVideoTitleNeutral(item) : item.title;
  const segs = text.split(' · ').map((s) => s.trim());
  if (segs.length === 0) return <p className={className}>{text}</p>;

  const [first, ...rest] = segs;
  const isLinkable = first === 'Course clip' || first === 'Instructor tip';
  const restJoined = rest.length > 0 ? ` · ${rest.join(' · ')}` : '';

  return (
    <p className={className}>
      {isLinkable ? (
        <a
          href={CLIP_TYPE_HREFS[first] ?? '#'}
          className="text-[var(--cds-color-blue-700)] hover:text-[var(--cds-color-blue-800)]"
          onClick={(e) => e.stopPropagation()}
        >
          {first}
        </a>
      ) : (
        first
      )}
      {restJoined}
    </p>
  );
};
