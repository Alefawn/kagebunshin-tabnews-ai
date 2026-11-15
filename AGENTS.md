# AGENTS.md

## Project

IT management panel ("Kagebunshin") built with Next.js 16.2.12 (App Router, Turbopack), React 19, TypeScript (strict) and PostgreSQL (via `pg`, raw SQL, no ORM). Multi-user with email/password and Google login, cookie sessions stored in the database and role-based permissions. UI text is Brazilian Portuguese.

## Commands

```bash
npm install
npm run db:up
npm run db:setup
npm run dev
npm run build
npm start
npm run typecheck
```

- `db:up` starts Postgres from `docker-compose.yml`; `db:setup` applies `db/schema.sql` and seeds (idempotent, safe to re-run).
- There is no lint, formatter or test runner configured. Validate changes with `npm run typecheck` and `npm run build`.

## Environment

Copy `.env.example` to `.env` (gitignored). `DATABASE_URL`, `APP_URL`, `ADMIN_NOME`/`ADMIN_EMAIL`/`ADMIN_PASSWORD` (used only by `db:setup` to create the admin), `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (optional; without them the Google button is disabled). The Google OAuth redirect URI is `${APP_URL}/api/auth/google/callback`. Never print or commit `.env`.

## Roles and permissions

- `admin`: exactly one (enforced by the partial unique index `usuarios_um_admin`); can do everything, including divisões, kanban columns and users/roles. `admin` is never assignable through the API.
- `gestor`: bound to one divisão; creates/edits/deletes seções and items of that divisão, and manages users with papel `usuario` inside it.
- `usuario`: bound to one seção; reads the whole divisão, creates/edits missões, wiki and scripts (including moving missões between columns) only in their own seção; never deletes.
- Users without divisão (self sign-up or first Google login) are pending and see empty lists until an admin/gestor assigns them.
- `src/lib/permissoes.ts` is the single source of truth: route handlers enforce it with rows loaded from the database, views use the same functions only to hide/disable actions. Change rules there, never only in the UI.

## Layout

- `src/app/page.tsx`, `login/`, `cadastro/` — public landing page and auth pages.
- `src/app/(painel)/` — authenticated routes (`inicio`, `secoes`, `missoes`, `wiki`, `scripts`, `usuarios`, `configuracoes`, `perfil`); its `layout.tsx` checks the session server-side and redirects to `/login`. Each `page.tsx` only exports `metadata` and renders a view.
- `src/app/api/**/route.ts` — REST handlers (JSON camelCase, errors as `{ erro }` in Portuguese).
- `src/lib/server/` — server-only code: `db.ts` (pool, `query`, `transaction`), `sessao.ts` (cookie `kb_sessao`, sha256-hashed tokens in `sessoes`), `senha.ts` (scrypt), `http.ts` (`exigirUsuario`, `verificarOrigem`, `erro`), `appUrl.ts`. Never import these from client components.
- `src/components/DataProvider.tsx` — `useData()`: loads `GET /api/dados`, exposes async actions calling the API, the session user and the theme.
- `src/components/UIProvider.tsx` — `useUI()` with `toast()`, async `confirm()` and the `Modal` component.
- `src/components/views/*View.tsx` — client UI per page.
- `src/lib/types.ts`, `src/lib/store.ts` (pure helpers), `src/lib/markdown.ts` (safe wiki renderer), `src/app/globals.css` (single stylesheet, CSS variables, `[data-theme="dark"]`).
- `db/schema.sql`, `scripts/db-setup.mjs` — schema and seed.

## Domain vocabulary

- `divisao` = division (has seções), `secao` = section, `missao` = kanban card, `coluna` = kanban column (global, ordered by `posicao`), `responsavel` = assignee, `prazo` = due date (`YYYY-MM-DD` or `''`), `ordem` = position inside a column, `papel` = role.
- The last column is treated as "done" in Início counts.
- Items always have `divisao_id`; `secao_id` may be null ("Sem seção"). Deleting a seção unlinks its items; deleting a divisão is refused while it has seções, users or items.

## Conventions

- Mutating handlers must call `verificarOrigem`, `exigirUsuario` and the permission functions; derive `divisaoId` from the seção on the server instead of trusting the client.
- Schema changes go in `db/schema.sql` written idempotently (`IF NOT EXISTS`, guarded `ALTER`), since `db:setup` re-runs it on existing databases.
- Use `useUI().confirm()`/`toast()`, never `window.confirm`/`alert`; forms use `Modal`.
- Render user content as JSX text. `dangerouslySetInnerHTML` only for the theme script in `layout.tsx` and `renderMarkdown` output. User colors go through `safeColor`.
- No code comments. Imports use `@/`. No external UI, styling, state or auth libraries; `next` stays pinned to an exact version.
- New panel route: add `src/app/(painel)/<rota>/page.tsx` + view, then `NAV` and `TITULOS` in `AppShell.tsx`. Views using `useSearchParams` need `<Suspense>` in `page.tsx`.

## Gotchas

- In route handlers, set cookies on a `NextResponse` (`res.cookies.set`) when returning a redirect; `Response.redirect` has immutable headers and drops them.
- The theme preference lives in `localStorage` key `kagebunshin:tema` and is applied before paint by the inline script in `src/app/layout.tsx`; keep it in sync with `DataProvider`.
- Behind the Codespaces proxy the `Host` header is not the public host: `APP_URL` must be the public URL for Google redirects and secure cookies, and `verificarOrigem` compares against `x-forwarded-host`.
- Kanban drag-and-drop uses native HTML5 DnD; the "Coluna" select in the card modal is the keyboard/touch fallback and must keep working.
