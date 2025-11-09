# AI Agent Instructions for Crowe Code (Spark Template)

Purpose: Enable AI coding agents to make correct, fast changes in this repo with minimal context switching.

## Big picture
- Frontend-only React 19 + Vite app that ships a lightweight code editor UI. Entry path: `index.html` → `src/main.tsx` → `src/App.tsx`.
- State persists via Spark KV storage: `useKV` from `@github/spark/hooks`. Keys are namespaced per-user (e.g., `crowe-code-files-${userId}`) to isolate workspaces.
- Styling: Tailwind v4 + CSS variables. `tailwind.config.js` reads optional `theme.json` and exposes variables like `--color-*`, `--editor-*`. Global styles in `src/styles/theme.css`, `src/main.css`, `src/index.css`.
- Error handling: `react-error-boundary` with `ErrorFallback.tsx`. In dev, errors rethrow to aid debugging.
- Vite plugins are required: `@tailwindcss/vite`, `@github/spark/spark-vite-plugin`, and the Phosphor icon import proxy. Do not remove.

## Key modules and flow
- `src/App.tsx`: App shell, keyboard shortcuts, persistent file tree, tab management, save behavior, sidebar visibility, top bar with user/profile, settings, share.
  - Shortcuts: Ctrl/Cmd+S save; Ctrl/Cmd+N new file; Ctrl/Cmd+W close tab; Ctrl/Cmd+B toggle sidebar.
  - Persists `files`, `openTabs`, and `activeTabId` via `useKV`.
- `src/components/CodeEditor.tsx`: Textarea-based editor with line numbers, tab insertion, cursor tracking via `onSelect`/`onKeyUp`. Keep it lightweight—no heavy async in render path.
- `src/components/*` and `src/components/ui/*`: Higher-level app components vs. reusable UI primitives (Radix/shadcn style). Use `cn` from `src/lib/utils.ts` for class merging.
- `src/lib/editor-utils.ts`: `detectLanguage(filename)` and `generateId()` helpers. Use these consistently for tabs/files.
- `src/lib/api.ts`: Fetch helpers for domain data (chemistry). Pattern: build `URLSearchParams`, `fetch`, `throw` on `!res.ok`, return typed JSON.
- Types live in `src/types/*` (e.g., `EditorTab`, `FileItem`, chemistry DTOs). Keep API contracts aligned with these.

## Build/run/lint
- Dev: `npm run dev` (Vite). Entry mounts to `#root` in `index.html`.
- Build: `npm run build` (TS build with `--noCheck` + Vite bundle).
- Preview: `npm run preview`.
- Lint: `npm run lint` (ESLint 9). TS is in bundler mode with `strictNullChecks`.

## Environment & integration points
- API base: `VITE_API_URL` (defaults to `http://localhost:8000/api/v1`). Endpoints used: `/health`, `/stats`, `/compounds`, `/reactions`, `/literature`.
- Spark metadata (`spark.meta.json`): `{ "dbType": "kv" }`—state is local KV; avoid direct `localStorage`, prefer `useKV`.
- Module alias: use `@/*` for imports (configured in `vite.config.ts` + `tsconfig.json`).

## Conventions that matter
- Persisted state: Always include `userId` in KV keys to prevent leakage across users (see `App.tsx`).
- Tabs/files: Update `isDirty` on edit; only clear on explicit save. Saving writes tab content back to the corresponding `FileItem`.
- UI theming: Prefer CSS variables already defined; extend via `theme.json` where possible rather than hard-coding colors.
- Icons: Use Phosphor or Lucide as seen in components; the Vite proxy plugin handles Phosphor imports.
- Error UX: Let dev throw in `ErrorFallback` (keeps fast feedback), but keep user-friendly messaging in production.

## Safe ways to extend
- New feature/state: Store with `useKV<T>(key, initial)`; namespace by user and feature, e.g., `crowe-code-<feature>-${userId}`.
- New API calls: Add to `src/lib/api.ts`, return typed promises using `src/types/*`; follow existing error/params pattern.
- New components: Place in `src/components`; keep them controlled/pure. Reuse primitives from `src/components/ui/*` and helper `cn`.
- Keyboard actions: Register once in `App.tsx` with `useEffect` and clean up the listener.

## Do not
- Remove `sparkPlugin()` or the Phosphor icon proxy from `vite.config.ts`.
- Bypass `useKV` with ad-hoc storage; it breaks portability and user isolation.
- Introduce routing without confirming UX—this app is a single-workspace surface today.

References
- Entry: `index.html`, `src/main.tsx`, `src/App.tsx`
- State/types: `src/types/editor.ts`, `src/lib/editor-utils.ts`
- API: `src/lib/api.ts`, `src/types/chemistry.ts`
- UI: `src/components/*`, `src/components/ui/*`
- Tooling: `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `theme.json`