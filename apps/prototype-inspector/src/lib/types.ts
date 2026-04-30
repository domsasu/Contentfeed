export type ChangelogEntry = {
  sha: string;
  shortSha?: string;
  title: string;
  date: string;
  files: string[];
};

export type ChangelogIndex = {
  commits: ChangelogEntry[];
};

export type DockTabId = 'segments' | 'experiments' | 'checklist' | 'toolbox' | 'changelog';
