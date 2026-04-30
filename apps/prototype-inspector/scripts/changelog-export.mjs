/**
 * Writes apps/prototype-inspector/public/changelog/index.json from git history.
 * Run from Contentfeed repo root:
 *   node apps/prototype-inspector/scripts/changelog-export.mjs
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inspectorRoot = path.resolve(__dirname, '..');
const outPath = path.join(inspectorRoot, 'public', 'changelog', 'index.json');

function findGitRoot(start) {
  let dir = start;
  for (let i = 0; i < 8; i += 1) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

const gitRoot = findGitRoot(inspectorRoot);

function sh(cmd) {
  return execSync(cmd, {
    encoding: 'utf8',
    cwd: gitRoot,
    maxBuffer: 10 * 1024 * 1024,
  }).trim();
}

const maxCommits = Number(process.env.CHANGELOG_LIMIT || '40', 10);

const metaLines = sh(
  `git log -n ${maxCommits} --format=%H%x09%s%x09%cs`
).split('\n');

const commits = [];

for (const line of metaLines) {
  if (!line) continue;
  const parts = line.split('\t');
  if (parts.length < 3) continue;
  const [sha, title, dateRaw] = parts;
  const filesRaw = sh(`git diff-tree --no-commit-id --name-only -r ${sha}`);
  const files = filesRaw ? filesRaw.split('\n').filter(Boolean) : [];
  commits.push({
    sha,
    shortSha: sha.slice(0, 7),
    title,
    date: (dateRaw.split(' ')[0] ?? dateRaw).trim(),
    files,
  });
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ commits }, null, 2), 'utf8');
console.log(`Wrote ${commits.length} commits to ${path.relative(gitRoot, outPath)}`);
