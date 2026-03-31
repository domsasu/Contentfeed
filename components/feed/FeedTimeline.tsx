import React from 'react';
import type { FeedCohortId, FeedPlaceholderItem } from '../../constants/feedCohorts';
import { FeedMediaCard } from './FeedMediaCard';

interface FeedTimelineProps {
  cohortId: FeedCohortId | 'all';
  items: FeedPlaceholderItem[];
}

export const FeedTimeline: React.FC<FeedTimelineProps> = ({ cohortId, items }) => (
  <div className="space-y-6">
    {items.map((item, i) => (
      <FeedMediaCard key={`${cohortId}-${i}-${item.type}`} item={item} />
    ))}
  </div>
);
