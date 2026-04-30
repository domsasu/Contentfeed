import type { ChangelogIndex, ChangelogEntry } from './types';

export async function loadChangelogIndex(): Promise<ChangelogIndex> {
  const res = await fetch('/changelog/index.json');
  if (!res.ok) throw new Error(`Failed to load changelog: ${res.status}`);
  return res.json() as Promise<ChangelogIndex>;
}

export async function loadCommitNote(sha: string): Promise<string> {
  const res = await fetch(`/changelog/notes/${sha}.md`);
  if (res.ok) return res.text();
  return `_(No note file yet. Add \`public/changelog/notes/${sha}.md\` and re-run the dev server.)_`;
}

export function shortSha(entry: ChangelogEntry): string {
  return entry.shortSha ?? entry.sha.slice(0, 7);
}
