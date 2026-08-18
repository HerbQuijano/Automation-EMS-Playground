# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Full-stack Employee Management System (EMS) built as a **QA/automation testing playground** — not a production app. It exists to give automation engineers realistic scenarios: CRUD, auth, audit trails, slow/flaky endpoints, and a dedicated UI locator-practice page. Keep this purpose in mind: intentionally awkward UI/API behaviors (duplicate labels, flaky endpoints, unstable ids) are features, not bugs.

npm workspaces root (`ems-backend`, `ems-frontend`).

## Commands

Run from repo root unless noted.

- `npm install` — installs all workspaces
- `npm run db:reset` — drop/recreate/seed SQLite DB (run once after install)
- `npm run dev` — backend + frontend concurrently (recommended)
- `npm run dev:api` — backend only
- `npm run dev:web` — frontend only (Vite, `--host`)
- `npm run build` — build frontend
- `npm run lint` — lint frontend (ESLint)
- `npm test` — backend Jest unit tests
- `npm run db:init` / `npm run db:seed` — schema-only / seed-only

Single backend test file: `cd ems-backend && npx jest tests/unit/middlewares/auth.test.js`
Backend dev with auto-reload + OpenAPI lint: `cd ems-backend && npm run dev` (runs `lint:openapi` then `nodemon server.js`)

- Backend API: `http://0.0.0.0:3000` (binds all interfaces for LAN/Tailscale access)
- Swagger UI: `http://localhost:3000/api/docs`
- Frontend: `http://localhost:5173`
- UI automation practice page: `http://localhost:5173/ui-playground`

Seeded credentials (see README for full list): `admin@ems.local` / `Admin123!` (role `admin`), plus `manager` and `viewer` role accounts.

## Architecture

### Backend (`ems-backend`, CommonJS, Express 5)

- `server.js` → `src/app.js`: middleware order matters — `requestId` is applied before `qaRoutes`/`auditRoutes` are mounted, but `healthRoutes`/`authRoutes`/`employeesRoutes` are mounted after `initSchema()` is kicked off. DB schema init runs on every boot (`src/db/schema.js`, `CREATE TABLE IF NOT EXISTS`).
- `src/db/index.js` — thin promise wrappers (`run`, `get`, `all`) around `sqlite3`; all route/service code goes through these, never touches the driver directly.
- Auth is custom token-based (not JWT despite README wording): `sessions` table maps opaque tokens to users with `expires_at`. `src/middlewares/auth.js` exports `requireAuth` (validates session, checks expiry and `is_locked`) and `requireRole(...roles)` for RBAC. Every route module that needs auth calls `router.use(requireAuth)` or applies it per-route.
- Roles: `admin`, `manager`, `viewer`. Employee create/update require admin or manager; delete and audit log access require admin only.
- `src/services/audit.service.js` — `writeAuditLog(...)` is called from mutating routes (employee CRUD, QA endpoints) to record actor, action, entity, `request_id`, and JSON details into `audit_logs`. When adding a new mutating endpoint, wire up an audit log call the same way.
- `src/routes/qa.routes.js` — deliberately unreliable endpoints (`/api/slow?ms=`, `/api/flaky?failRate=`) for testing timeouts/retries. Keep them intentionally janky.
- OpenAPI spec lives at `src/swagger/openapi.yaml`, served via `swagger-ui-express` at `/api/docs`, and linted with `@redocly/cli` as part of `npm run dev`. Update the spec when changing routes/request-response shapes.
- Tests (`ems-backend/tests/unit`) are Jest unit tests for middlewares and services only — no route/integration tests currently exist.

### Frontend (`ems-frontend`, React 19 + Vite)

- `src/api/client.js` — single `apiFetch` wrapper: injects bearer token from `src/auth/authStore.js`, auto-clears auth and redirects to `/login` on 401, normalizes error shape (`err.status`, `err.data`). Use this wrapper for all API calls rather than raw `fetch`.
- `src/components/ProtectedRoute.jsx` gates authenticated routes; `Layout.jsx` is the shared shell.
- `src/pages/UiPlayground.jsx` is the automation-practice page — it intentionally contains duplicate labels, dynamic filtering/shuffling, and unstable DOM ids to force robust locator strategies (role/accessible-name/test-id based, not positional). `data-testid`-style hooks used there include `pg-hard-*` (locator practice) and `pg-evt-*` (event propagation/keyboard/custom-event practice). Preserve these patterns and ids when touching this page — they're the point of the file.

### CI (`.github/workflows/ci.yml`)

Two independent jobs on push/PR to `main`: `backend-tests` (`npm test --workspace ems-backend`) and `frontend-checks` (`npm run lint` + `npm run build` for `ems-frontend`).

### Container deployment

`ems-frontend/nginx.conf` serves the built SPA and proxies `/api` to `http://backend:3000` — implies a two-container setup (frontend nginx + backend service named `backend`). `Dockerfile`/`docker-compose.yml` are gitignored (not committed), so no compose file exists in-repo to reference.

## Notes

- README's "Reports" section (Playwright/Allure commands) refers to an external test suite, not this repo — no Playwright or Allure dependency exists in any `package.json` here.
