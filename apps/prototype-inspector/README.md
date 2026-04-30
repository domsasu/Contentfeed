# Prototype inspector

Standalone Vite app for reviewing a prototype alongside **git commits**, **editable Markdown notes**, and **derived “affected areas”** from changed files.

## Run

```bash
cd apps/prototype-inspector
npm install
npm run dev
```

Default preview URL: `http://localhost:3000` (Contentfeed dev). Change in the UI; it persists in `localStorage`.

## Changelog data

- **`public/changelog/index.json`** — list of commits with `files[]`. Regenerate from git:

  ```bash
  # from Contentfeed repo root
  node apps/prototype-inspector/scripts/changelog-export.mjs
  ```

- **`public/changelog/notes/<full-sha>.md`** — human-editable notes per commit (not overwritten by export).

## Highlights in the preview

Cross-origin iframes cannot be styled from this app. Add the **bridge** from `packages/prototype-inspect-bridge/` to your prototype (dev only). Messages: `PROTOTYPE_INSPECT_HIGHLIGHT` / `PROTOTYPE_INSPECT_CLEAR`.

## Configure

- **`src/lib/fileToSection.ts`** — map changed paths → section ids for chips + `postMessage`.
- **`VITE_REPO_URL`** in `.env` — optional “Open repository” button in Toolbox.
