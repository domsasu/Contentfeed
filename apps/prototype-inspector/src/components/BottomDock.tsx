import { useCallback, useRef } from 'react';
import type { DockTabId } from '@/lib/types';

const TABS: { id: DockTabId; label: string }[] = [
  { id: 'segments', label: 'Segments' },
  { id: 'experiments', label: 'Experiments' },
  { id: 'checklist', label: 'Checklist' },
  { id: 'toolbox', label: 'Toolbox' },
  { id: 'changelog', label: 'Changelog' },
];

type BottomDockProps = {
  activeTab: DockTabId;
  onTabChange: (id: DockTabId) => void;
  panelId: string;
  children: React.ReactNode;
};

export function BottomDock({ activeTab, onTabChange, panelId, children }: BottomDockProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = useCallback((index: number) => {
    const len = TABS.length;
    const i = ((index % len) + len) % len;
    onTabChange(TABS[i]!.id);
    requestAnimationFrame(() => {
      tabRefs.current[i]?.focus();
    });
  }, [onTabChange]);

  const onTabKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        focusTab(index + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        focusTab(index - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        focusTab(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        focusTab(TABS.length - 1);
      }
    },
    [focusTab]
  );

  return (
    <div className="dock">
      <div className="dock-tabs" role="tablist" aria-label="Prototype inspector">
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`dock-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={panelId}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className="dock-tab"
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => onTabKeyDown(e, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={`dock-tab-${activeTab}`}
        tabIndex={0}
        className="dock-panel"
      >
        {children}
      </div>
    </div>
  );
}
