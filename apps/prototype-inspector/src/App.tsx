import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BottomDock } from './components/BottomDock';
import { loadChangelogIndex, loadCommitNote, shortSha } from './lib/changelog';
import { sectionsForFiles } from './lib/fileToSection';
import { postClearToPrototype, postHighlightToPrototype } from './lib/postMessageBridge';
import type { ChangelogEntry, ChangelogIndex, DockTabId } from './lib/types';

const PREVIEW_URL_KEY = 'prototype-inspector-preview-url';
const EXP_PREFIX = 'prototype-inspector-exp-';
const CHECKLIST_PREFIX = 'prototype-inspector-check-';

const DEFAULT_PREVIEW = 'http://localhost:3000';

function useLocalStorageState(key: string, initial: string) {
  const [v, setV] = useState(() => {
    try {
      return localStorage.getItem(key) ?? initial;
    } catch {
      return initial;
    }
  });
  const set = useCallback(
    (next: string) => {
      setV(next);
      try {
        localStorage.setItem(key, next);
      } catch {
        /* ignore */
      }
    },
    [key]
  );
  return [v, set] as const;
}

function useChecklistState(lineKey: string, defaultChecked: boolean) {
  const key = `${CHECKLIST_PREFIX}${lineKey}`;
  const [checked, setChecked] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      if (v === '1') return true;
      if (v === '0') return false;
      return defaultChecked;
    } catch {
      return defaultChecked;
    }
  });
  const toggle = useCallback(() => {
    setChecked((c) => {
      const next = !c;
      try {
        localStorage.setItem(key, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [key]);
  return [checked, toggle] as const;
}

export default function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const commitBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const prevDockTab = useRef<DockTabId | null>(null);
  const [previewUrl, setPreviewUrl] = useLocalStorageState(PREVIEW_URL_KEY, DEFAULT_PREVIEW);
  const [iframeSrc, setIframeSrc] = useState(previewUrl);
  const [activeTab, setActiveTab] = useState<DockTabId>('changelog');
  const [changelog, setChangelog] = useState<ChangelogIndex | null>(null);
  const [changelogErr, setChangelogErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<ChangelogEntry | null>(null);
  const [noteMd, setNoteMd] = useState<string>('');
  const [segments, setSegments] = useState<{ id: string; label: string }[]>([]);
  const [checklistRaw, setChecklistRaw] = useState<string>('');

  const [expA, setExpA] = useState(() => localStorage.getItem(`${EXP_PREFIX}a`) === '1');
  const [expB, setExpB] = useState(() => localStorage.getItem(`${EXP_PREFIX}b`) === '1');
  const [expC, setExpC] = useState(() => localStorage.getItem(`${EXP_PREFIX}c`) === '1');

  const repoUrl = import.meta.env.VITE_REPO_URL;

  useEffect(() => {
    loadChangelogIndex()
      .then(setChangelog)
      .catch((e: unknown) => setChangelogErr(String(e)));
    fetch('/segments.json')
      .then((r) => r.json())
      .then((d: { segments: { id: string; label: string }[] }) => setSegments(d.segments ?? []))
      .catch(() => setSegments([]));
    fetch('/checklist.md')
      .then((r) => r.text())
      .then(setChecklistRaw)
      .catch(() => setChecklistRaw(''));
  }, []);

  useEffect(() => {
    if (!selected) {
      setNoteMd('');
      postClearToPrototype(iframeRef.current?.contentWindow ?? null);
      return;
    }
    let cancelled = false;
    loadCommitNote(selected.sha).then((md) => {
      if (!cancelled) setNoteMd(md);
    });
    const secs = sectionsForFiles(selected.files);
    postHighlightToPrototype(iframeRef.current?.contentWindow ?? null, secs);
    return () => {
      cancelled = true;
    };
  }, [selected]);

  useEffect(() => {
    if (activeTab === 'changelog' && prevDockTab.current !== null && prevDockTab.current !== 'changelog') {
      requestAnimationFrame(() => {
        commitBtnRefs.current[0]?.focus();
      });
    }
    prevDockTab.current = activeTab;
  }, [activeTab]);

  const derivedSections = useMemo(
    () => (selected ? sectionsForFiles(selected.files) : []),
    [selected]
  );

  const applyPreviewUrl = useCallback(() => {
    setIframeSrc(previewUrl.trim() || DEFAULT_PREVIEW);
    postClearToPrototype(iframeRef.current?.contentWindow ?? null);
  }, [previewUrl]);

  const copySha = useCallback(() => {
    if (!selected?.sha) return;
    void navigator.clipboard.writeText(selected.sha);
  }, [selected]);

  const setExp = (id: 'a' | 'b' | 'c', value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    try {
      localStorage.setItem(`${EXP_PREFIX}${id}`, value ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  const checklistLines = useMemo(() => {
    return checklistRaw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('- ['));
  }, [checklistRaw]);

  const panelId = 'dock-panel-main';

  return (
    <div className="app-shell">
      <div className="app-main">
        <div className="preview-toolbar">
          <label htmlFor="preview-url">Preview URL</label>
          <input
            id="preview-url"
            name="preview-url"
            type="url"
            value={previewUrl}
            onChange={(e) => setPreviewUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyPreviewUrl();
            }}
            placeholder={DEFAULT_PREVIEW}
            aria-describedby="preview-hint"
          />
          <button type="button" onClick={applyPreviewUrl}>
            Load
          </button>
          <span id="preview-hint" className="sr-only">
            Loads the prototype in the frame below. Add the inspect bridge script to the prototype for
            cross-origin highlights.
          </span>
        </div>
        <div className="preview-frame-wrap">
          <iframe
            ref={iframeRef}
            key={iframeSrc}
            title="Prototype preview"
            src={iframeSrc}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
          {!iframeSrc ? (
            <div className="preview-placeholder">Enter a preview URL and press Load.</div>
          ) : null}
        </div>
      </div>

      <BottomDock activeTab={activeTab} onTabChange={setActiveTab} panelId={panelId}>
        {activeTab === 'segments' && (
          <>
            <h3>Segments</h3>
            <p style={{ color: 'var(--dock-muted)', fontSize: '0.8rem', marginTop: 0 }}>
              Config-driven areas (see <code>public/segments.json</code>).
            </p>
            <ul className="commit-list">
              {segments.map((s) => (
                <li key={s.id} style={{ padding: '0.35rem 0' }}>
                  <strong>{s.label}</strong>
                  <span className="commit-sha" style={{ marginLeft: '0.5rem' }}>
                    {s.id}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
        {activeTab === 'experiments' && (
          <>
            <h3>Experiments</h3>
            <p style={{ color: 'var(--dock-muted)', fontSize: '0.8rem', marginTop: 0 }}>
              Stub toggles (wire to feature flags in your app). Stored in{' '}
              <code>localStorage</code>.
            </p>
            <div className="experiment-row">
              <span>Experiment A</span>
              <input
                type="checkbox"
                checked={expA}
                onChange={(e) => setExp('a', e.target.checked, setExpA)}
                aria-label="Toggle experiment A"
              />
            </div>
            <div className="experiment-row">
              <span>Experiment B</span>
              <input
                type="checkbox"
                checked={expB}
                onChange={(e) => setExp('b', e.target.checked, setExpB)}
                aria-label="Toggle experiment B"
              />
            </div>
            <div className="experiment-row">
              <span>Experiment C</span>
              <input
                type="checkbox"
                checked={expC}
                onChange={(e) => setExp('c', e.target.checked, setExpC)}
                aria-label="Toggle experiment C"
              />
            </div>
          </>
        )}
        {activeTab === 'checklist' && (
          <>
            <h3>Checklist</h3>
            <p style={{ color: 'var(--dock-muted)', fontSize: '0.8rem', marginTop: 0 }}>
              Edit <code>public/checklist.md</code> in this app.
            </p>
            {checklistLines.length === 0 ? (
              <p style={{ color: 'var(--dock-muted)' }}>No checklist loaded.</p>
            ) : (
              checklistLines.map((line) => {
                const m = line.match(/^- \[([ xX])\]\s*(.+)$/);
                const done = m?.[1]?.toLowerCase() === 'x';
                const label = m?.[2] ?? line;
                const key = label.slice(0, 48).replace(/\W+/g, '-');
                return (
                  <ChecklistRow key={key} label={label} defaultChecked={done} lineKey={key} />
                );
              })
            )}
          </>
        )}
        {activeTab === 'toolbox' && (
          <>
            <h3>Toolbox</h3>
            <div className="toolbox-actions">
              {repoUrl ? (
                <button type="button" onClick={() => window.open(repoUrl, '_blank', 'noopener,noreferrer')}>
                  Open repository
                </button>
              ) : null}
              <button type="button" onClick={() => void navigator.clipboard.writeText(previewUrl)}>
                Copy preview URL
              </button>
              <button type="button" disabled={!selected} onClick={copySha}>
                Copy selected commit SHA
              </button>
            </div>
            <p style={{ color: 'var(--dock-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
              Docs: <code>apps/prototype-inspector/README.md</code> · Bridge:{' '}
              <code>packages/prototype-inspect-bridge/</code>
            </p>
            <p style={{ color: 'var(--dock-muted)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
              Run <code>npm run changelog:export</code> from the repo root to refresh{' '}
              <code>index.json</code>.
            </p>
          </>
        )}
        {activeTab === 'changelog' && (
          <>
            <h3>Changelog</h3>
            {changelogErr ? <p style={{ color: '#f88' }}>{changelogErr}</p> : null}
            {!changelog ? (
              <p style={{ color: 'var(--dock-muted)' }}>Loading…</p>
            ) : (
              <>
                <ul className="commit-list" aria-label="Commits">
                  {changelog.commits.map((c, index) => (
                    <li key={c.sha}>
                      <button
                        type="button"
                        className="commit-row"
                        ref={(el) => {
                          commitBtnRefs.current[index] = el;
                        }}
                        aria-current={selected?.sha === c.sha ? 'true' : undefined}
                        onClick={() => setSelected(c)}
                        onKeyDown={(e) => {
                          const len = changelog.commits.length;
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            const next = Math.min(index + 1, len - 1);
                            commitBtnRefs.current[next]?.focus();
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            const prev = Math.max(index - 1, 0);
                            commitBtnRefs.current[prev]?.focus();
                          } else if (e.key === 'Home') {
                            e.preventDefault();
                            commitBtnRefs.current[0]?.focus();
                          } else if (e.key === 'End') {
                            e.preventDefault();
                            commitBtnRefs.current[len - 1]?.focus();
                          }
                        }}
                      >
                        <span className="commit-sha">{shortSha(c)}</span>
                        <span className="commit-title">{c.title}</span>
                        <span className="commit-meta">{c.date}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {selected ? (
                  <div className="changelog-detail">
                    <h4>Affected areas</h4>
                    <div className="section-chips" aria-label="Derived sections from changed files">
                      {derivedSections.length === 0 ? (
                        <span style={{ color: 'var(--dock-muted)', fontSize: '0.8rem' }}>
                          No mapped sections (edit <code>src/lib/fileToSection.ts</code>).
                        </span>
                      ) : (
                        derivedSections.map((s) => (
                          <span key={s} className="section-chip">
                            {s}
                          </span>
                        ))
                      )}
                    </div>
                    <h4>Files</h4>
                    <ul className="files-list">
                      {selected.files.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    <h4>Notes</h4>
                    <div className="notes-md">{noteMd}</div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--dock-muted)', marginTop: '0.75rem' }}>
                    Select a commit to see notes, files, and send highlight messages to the preview (if the
                    bridge is installed).
                  </p>
                )}
              </>
            )}
          </>
        )}
      </BottomDock>
    </div>
  );
}

function ChecklistRow({
  label,
  defaultChecked,
  lineKey,
}: {
  label: string;
  defaultChecked: boolean;
  lineKey: string;
}) {
  const [checked, toggle] = useChecklistState(lineKey, defaultChecked);
  return (
    <div className="checklist">
      <label>
        <input type="checkbox" checked={checked} onChange={toggle} />
        <span>{label}</span>
      </label>
    </div>
  );
}
