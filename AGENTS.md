# AGENTS.md

## Project

IT management panel built with Next.js (App Router, Turbopack), React and TypeScript (strict). Client-only app: there is no backend, API route or database; all data lives in the browser's `localStorage`. UI text is Brazilian Portuguese.

## Commands

```bash
npm install
npm run dev
npm run build
npm start
npm run typecheck
```

There is no lint, formatter or test runner configured. Validate changes with `npm run typecheck` and `npm run build`.

## Layout

- `src/app/` — one folder per route (`inicio`, `secoes`, `missoes`, `wiki`, `scripts`, `configuracoes`, `perfil`). Each `page.tsx` is a thin server component that only exports `metadata` and renders the matching view.
- `src/app/layout.tsx` — root layout, inline theme script, `Providers` + `AppShell`.
- `src/app/globals.css` — all styling (single stylesheet, CSS custom properties, `[data-theme="dark"]` overrides, no CSS modules/Tailwind).
- `src/components/views/*View.tsx` — the client component holding each page's UI and logic.
- `src/components/AppShell.tsx` — sidebar nav (`NAV`), topbar title map (`TITULOS`), theme toggle, mobile drawer.
- `src/components/DataProvider.tsx` — `useData()`: loads/persists `AppData`, exposes actions, applies the theme.
- `src/components/UIProvider.tsx` — `useUI()` with `toast()` and async `confirm()`, plus the reusable `Modal` component.
- `src/lib/store.ts` — pure, immutable data transforms (seed, CRUD, `moveMissao`, `moveColuna`, import validation, `STORAGE_KEY`).
- `src/lib/types.ts` — domain types (`AppData`, `Secao`, `Coluna`, `Missao`, `WikiPage`, `Script`, `Profile`, `Tema`, `Prioridade`).
- `src/lib/markdown.ts` — minimal safe markdown renderer for the wiki.

## Domain vocabulary

Identifiers and UI use Portuguese terms; keep them consistent:

- `secao` = section/area of IT, `missao` = task card on the kanban, `coluna` = kanban column, `responsavel` = assignee, `prazo` = due date (`YYYY-MM-DD` or `''`), `ordem` = position inside a column.
- The **last column** in `colunas` is treated as "done" (open vs. completed counts on Início depend on it).
- Items with `secaoId: ''` are shown as "Sem seção"; deleting a seção unlinks its items instead of deleting them.

## Conventions

- Data changes go through `src/lib/store.ts` as pure functions returning a new `AppData`, then are exposed as actions in `DataProvider`. Do not call `localStorage` from views.
- Use `useUI().confirm()` and `toast()` for dialogs/feedback; never `window.confirm`/`alert`.
- Use the `Modal` component from `UIProvider` for forms.
- Render user content as JSX text. `dangerouslySetInnerHTML` is only allowed for the theme script in `layout.tsx` and the output of `renderMarkdown` (which escapes HTML first) — keep it that way.
- Colors coming from user data must pass through `safeColor` (`src/lib/utils.ts`) before being used in styles.
- Do not add code comments.
- Imports use the `@/` alias for `src/`.
- No external UI, styling or state libraries; keep dependencies minimal. `next` is pinned to an exact version on purpose.

## Adding a route

1. Create `src/app/<rota>/page.tsx` exporting `metadata = { title }` and rendering a new `src/components/views/<Nome>View.tsx` (`'use client'`).
2. Add the entry to `NAV` (with inline SVG icon) and `TITULOS` in `AppShell.tsx`.
3. If the view uses `useSearchParams`, wrap it in `<Suspense>` in `page.tsx` (as `missoes/page.tsx` does), otherwise `next build` fails.

## Gotchas

- Persisted shape is versioned by the key `kagebunshin:data:v1`. Changing `AppData` requires updating `normalize()`/`validateImport()` in `store.ts` so existing browser data and imported JSON still load; bump the key only for breaking changes.
- `DataProvider` renders "Carregando..." until it has read `localStorage` (`hydrated`), to avoid hydration mismatches. Views can assume data is loaded; do not read `localStorage` during server render.
- The theme is applied before paint by the inline script in `layout.tsx`, which duplicates the storage key and theme resolution logic. Keep it in sync with `DataProvider` when changing either.
- `/` → `/inicio` is handled by `redirects()` in `next.config.ts` (real 307). `redirect()` in `src/app/page.tsx` alone returns 200 with a client-side redirect.
- Kanban drag-and-drop uses native HTML5 DnD; the "Coluna" select in the card edit modal is the keyboard/touch fallback and must keep working.
