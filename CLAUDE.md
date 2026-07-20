# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo context

`gdp-mobile` is a workspace package inside the `geodesie-de-poche` monorepo (root: `../`). The root also contains `gdp-tools` (the `@ign/gdp-tools` package, developed in tandem) and `espaceco-mobile-refonte` (a **reference-only** sibling app — never modify it, only borrow charte graphique / patterns from it).

Prefer running commands from the monorepo root so `gdp-tools` and `gdp-mobile` build/watch together. Running `npm run <script>` directly inside `gdp-mobile/` also works for app-only scripts.

## Commands

From the monorepo root (`geodesie-de-poche/`):

```bash
npm install
npm run dev          # gdp-tools (watch) + gdp-mobile (localhost:5173), concurrently
npm run dev:app      # gdp-mobile only
npm run dev:gdp-tools # @ign/gdp-tools only (watch)
npm run build        # full build: gdp-tools then gdp-mobile
npm run build:qualif # qualification build (sub-path /qlf-gdp/)
```

From `gdp-mobile/`:

```bash
npm run dev              # vite dev server
npm run build            # tsc -b && vite build (web, served at /)
npm run build:qualif     # build for a sub-path deployment (e.g. /qlf-gdp/), copies htaccess
npm run build:mobile     # build against gdp-tools dist (not source) — used for Capacitor
npm run lint             # eslint .
npm run preview          # preview a production build
```

There is no test suite in this package — do not invent test commands.

### Android / Capacitor (single app, `fr.ign.gdp`, phase 2)

```bash
npm run setup-android          # first-time: installs Capacitor android platform + GDP config (OAuth scheme, geoloc, camera)
npm run generate-apk           # builds web + cap sync + debug APK -> android/app/build/outputs/apk/debug/app-debug.apk
npm run capacitor-build        # build:mobile + cap sync android
npm run capacitor-run-android  # build + run on device/emulator
npm run open-android           # open project in Android Studio
```

Debugging the APK WebView: `chrome://inspect/#devices` (see README.md for the full ADB/udev troubleshooting table). For hot-reload without an APK: `npm run dev` + `adb reverse tcp:5173 tcp:5173`, then open `http://localhost:5173` in Chrome on the phone.

## Environment

Copy `.env.dist` → `.env` (dev) and fill in OAuth values (`VITE_OAUTH_CLIENT_ID`, `VITE_OAUTH_BASE_URL`). For qualification, copy `.env.qualif.dist` → `.env.qualif` and set `VITE_OAUTH_WEB_REDIRECT_URI`. Config is parsed/normalized once in `src/shared/config/env.ts` (`config` export) — read env vars through that module, not `import.meta.env` directly, elsewhere in the app.

Key flags: `VITE_AUTH_REQUIRED` (false lets `/` go straight to `/map` instead of `/welcome`), `VITE_BASE_PATH` (sub-path deploys), `VITE_GEODESY_SOURCE=dist` (build:mobile — use built gdp-tools instead of source alias).

## Architecture

### Layering (`src/`)

```
app/          App.tsx, router, providers, BottomTabbar, LeftMenu
domain/       pure models, no React / no network
infra/        auth, collaboratif API, OpenLayers, storage, cache
platform/     wrappers around @ign/mobile-device / Capacitor
features/     business hooks + components (auth, map, report, search, settings, welcome...)
pages/        routed screens — thin layer that composes features
shared/       UI kit, CSS modules, env config, constants, utils
styles/       global.css (EspaceCo design tokens)
```

Dependency direction: `pages/features → app → infra/platform → domain`. `domain/` must not import anything else. Don't invert this — e.g. don't reach from `domain/` into `infra/` or React.

### External packages this app builds on

- `@ign/gdp-tools` (+ `@ign/gdp-tools/react`) — all WMS/WFS geodesy catalogs, GetFeatureInfo, map hooks, report context. **Never duplicate WMS/WFS or GetFeatureInfo logic in gdp-mobile** — it belongs in gdp-tools. In dev, this resolves to `../gdp-tools/src` via a Vite alias (HMR); `VITE_GEODESY_SOURCE=dist` switches to the built package for mobile builds.
- `@ign/mobile-core` — `AuthManager` (OAuth2 PKCE), domain models (`User`, `ReportStatus`). Don't import `AuthManager` directly from a React component — go through `infra/auth/` (`authService.ts`).
- `@ign/mobile-device` — `Storage`: local persistence for tokens, profile, map preferences (layers, viewport).
- `collaboratif-client-api` — signalements (reports) and communities API client (`infra/api/collabApiClient.ts`).
- OpenLayers 10 + ol-ext — Géoportail map rendering.
- Capacitor (`@capacitor/*`) — native SSO browser, geolocation, device/app metadata; phase-2 mobile target, web-first otherwise.

### Auth flow

OAuth2 + PKCE, orchestrated by `infra/auth/authService.ts` wrapping `@ign/mobile-core`'s `AuthManager`. Routes: `/login`, `/auth/callback` (native redirect: `fr.ign.gdp://auth/callback`).

- Web dev: token/revoke calls go through the same-origin Vite proxy at `/__sso` (see `vite.config.ts` `oauthProxyMount`) to avoid CORS against Keycloak; native builds call the SSO base URL directly.
- `AuthGuard` (`src/app/router/AuthGuard.tsx`) gates protected routes via `useAuth()` — shows a loading screen while session restore is in flight, redirects to `/login` (preserving `location.state.from`) when unauthenticated.
- The map is browsable without auth; only signalement/account screens require it (`config.authRequired` controls whether `/` lands on `/welcome` or `/map`).

### Map / point sheet (`/map`)

- Map hook: `features/map/hooks/useMap.ts`; page: `pages/map/MapPage.tsx`; Géoportail base layers: `infra/map/openlayers/geoportailLayers.ts`.
- Point click flow: `useMapGeodesyClick` builds a `MapGeodesyClickAction` via `buildGeodesyPointDisplay` (from gdp-tools) → `MapPage` passes it to `MapBottomSheet` as `selectedPoint` → bottom sheet switches to **point mode** (dedicated snap heights, tabbar hidden, RGP search disabled).
- Point fiche components live under `features/map/components/MapBottomSheet/pointFiche/`: `MapPointSheet` (shell: header + body + footer) renders either `MapPointGeodesyFicheBody` or `MapPointNivellementFicheBody` depending on `resolvePointFicheVariant(action)`.
- 4 bottom-sheet snap levels (managed by `useBottomSheetSnap`): mini (header/footer only, no body) → medium 1 → medium 2 → full. Body is scrollable only at snap ≥ 1. Full details in `docs/FICHE_POINT.md`.

### Reports (signalements)

`features/report/` + `pages/report/`. Submission goes through `collaboratif-client-api`, authenticated via the stored session (`infra/auth`, `infra/api/ensureCollabApiSession.ts`). No dedicated Capacitor Camera plugin — native photo capture uses `<input type="file" accept="image/*" capture="environment">`; app checks landscape orientation client-side before upload.

## Conventions

- Import alias `@/` → `src/`. TS path mapping and Vite alias must stay in sync (`tsconfig.app.json` and `vite.config.ts`).
- CSS via co-located CSS Modules (`Component.module.css`), design tokens in `src/styles/global.css` (EspaceCo charte, e.g. `--color-primary` `#26A581`). Shared UI primitives (Button, PageHeader, Loading, ActionSheet, etc.) live in `shared/ui/`.
- Respond to the user in French where the project's own docs and UI are French — this is a French (IGN) project.
- Keep diffs minimal and scoped to `gdp-mobile/`; do not touch `espaceco-mobile-refonte/`.
