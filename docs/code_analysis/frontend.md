# Frontend Code Analysis

This file explains the frontend codebase from the point of view of a new engineer reading the project. The frontend is a Vite + React + TypeScript app that displays market status, fetches normalized history, subscribes to live Socket.IO updates, and renders the chart with ECharts. Ant Design is the base component system, Tailwind is used for layout utilities, and custom CSS is kept narrow for global tokens plus a few AntD/brand hooks.

## Frontend Mental Model

The frontend has five main responsibilities:

1. Ask the backend whether the market is open.
2. Load available symbols and normalized chart history.
3. Subscribe to live updates for the selected chart type and symbol.
4. Merge live updates into the current one-minute chart series.
5. Render a WingsFin-branded dashboard with loading, error, closed, empty, and live states.

The backend owns market rules and historical normalization. The frontend still performs live merge logic so the visible chart can update immediately between history refetches.

## Runtime Flow

### Browser Startup

```text
index.html
  -> /src/main.tsx
    -> React StrictMode
    -> App
  -> AppProviders
    -> AntD ConfigProvider + AntD App + QueryClientProvider
  -> Dashboard
```

### Dashboard Data Flow

```text
Dashboard mounts
  -> useMarketStatus() fetches /api/market/status
  -> useSymbols() fetches /api/symbols
  -> selected symbol is picked from symbols or fallback values
  -> if market is closed, render MarketClosedState
  -> if market is open, useChartHistory() fetches /api/chart/history
  -> LiveChartSection stores chart points in local state
  -> useMarketSocket() subscribes to live updates
  -> MarketChart renders ECharts line + latest heartbeat point
```

### Live Update Flow

```text
Socket receives market:update
  -> useMarketSocket validates type and symbol match current selection
  -> LiveChartSection.handleUpdate receives payload
  -> mergeLiveUpdate() replaces same-minute point, inserts out-of-order points chronologically, or fills missing minutes
  -> React state updates
  -> MarketChart recomputes ECharts option
```

### Minute Advance Flow

While the market is open, `LiveChartSection` runs a lightweight interval every second. It only changes state when the current minute changes. If no live tick arrives for the new minute, `advanceToMinute()` carries the latest value forward so the chart still reaches the current minute. The backend-provided chart timezone is passed into this minute formatting path.

## Backend Integration

| Frontend Call | Backend Endpoint/Event | Owner |
|---|---|---|
| `fetchMarketStatus()` | `GET /api/market/status` | `frontend/src/api/marketApi.ts` |
| `fetchSymbols()` | `GET /api/symbols` | `frontend/src/api/marketApi.ts` |
| `fetchChartHistory()` | `GET /api/chart/history?type=...&symbol=...` | `frontend/src/api/chartApi.ts` |
| `io(SOCKET_URL)` | Socket.IO connection | `frontend/src/hooks/useMarketSocket.ts` |
| `subscribe` event | Socket room subscription | `frontend/src/hooks/useMarketSocket.ts` |
| `market:update` event | Live point update | `frontend/src/hooks/useMarketSocket.ts` |
| `market:closed` event | Market closed refresh | `frontend/src/hooks/useMarketSocket.ts` |

## Root Files And Responsibilities

| File | Responsibility |
|---|---|
| `frontend/package.json` | Defines frontend scripts, dependencies, dev dependencies, module type, and Node engine. |
| `frontend/package-lock.json` | Locks exact npm dependency versions for repeatable installs. |
| `frontend/index.html` | Vite HTML entrypoint. Defines favicon, title, meta description, Google font links, and root mount node. |
| `frontend/Dockerfile` | Builds the static Vite app in a Node 22 Alpine builder stage and serves `dist` through nginx. |
| `frontend/nginx.conf` | Serves the built SPA on port `5173`, falls back to `index.html`, and caches static assets. |
| `frontend/README.md` | Frontend-local Vite/React usage notes. |
| `frontend/.env.example` | Documents Vite environment variables for API and socket URLs. |
| `frontend/.gitignore` | Excludes dependencies, build output, local env files, and generated artifacts. |
| `frontend/.dockerignore` | Keeps Docker build context small by excluding local/generated files. |
| `frontend/eslint.config.js` | ESLint config for React hooks, React refresh, TypeScript, browser globals, and ignored build files. |
| `frontend/vite.config.ts` | Vite config with React and Tailwind plugins, Vitest jsdom setup, and raised chunk warning limit for ECharts. |
| `frontend/tsconfig.json` | TypeScript project references for app and Node/Vite config. |
| `frontend/tsconfig.app.json` | TypeScript settings for browser app source. |
| `frontend/tsconfig.node.json` | TypeScript settings for Vite/Node-side config files. |

## Public And Asset Files

| File | Responsibility |
|---|---|
| `frontend/public/logo.webp` | Official WingsFin logo used in the dashboard header and browser favicon. |
| `frontend/public/favicon.svg` | Existing SVG favicon asset retained in the repo but not currently used by `index.html`. |
| `frontend/public/icons.svg` | SVG icon sprite/asset file retained for static use if needed. |
| `frontend/src/assets/hero.png` | Static image asset retained in source assets. |
| `frontend/src/assets/react.svg` | Default React scaffold asset, currently not used by the dashboard. |
| `frontend/src/assets/vite.svg` | Default Vite scaffold asset, currently not used by the dashboard. |

## Source Files And Responsibilities

### App Entrypoint

| File | Responsibility |
|---|---|
| `frontend/src/main.tsx` | React entrypoint. Imports AntD reset CSS, global CSS, and renders `<App />` inside `StrictMode`. |
| `frontend/src/App.tsx` | Thin app component that wraps the dashboard with `AppProviders`. |
| `frontend/src/providers/AppProviders.tsx` | Owns app-wide providers: AntD `ConfigProvider`, AntD `App`, and TanStack Query `QueryClientProvider`. |
| `frontend/src/theme/designTokens.ts` | Central token map for brand colors, fonts, exact chart point colors, and shared theme values. |
| `frontend/src/theme/antdTheme.ts` | Converts local design tokens into AntD theme configuration and CSS variables. |
| `frontend/src/index.css` | Global CSS entry. Imports Tailwind, defines CSS variables/global base rules, and keeps narrow brand/vendor hooks such as the hero background, hero copy margin reset, and AntD Select internal selector. Most layout and component styling lives in JSX utilities/AntD semantic `classNames`. |

### API Layer

| File | Responsibility |
|---|---|
| `frontend/src/api/client.ts` | Centralizes `VITE_API_BASE_URL`, `VITE_SOCKET_URL`, and typed `apiGet()` fetch helper. |
| `frontend/src/api/marketApi.ts` | Fetches market status and available symbols from backend endpoints. |
| `frontend/src/api/chartApi.ts` | Builds chart history query params and fetches normalized chart history. |

### Hooks

| File | Responsibility |
|---|---|
| `frontend/src/hooks/useMarketStatus.ts` | Wraps TanStack Query for market status and symbol list. Status refetches every 30 seconds; symbols cache for 5 minutes. |
| `frontend/src/hooks/useChartHistory.ts` | Wraps TanStack Query for chart history by `type` and `symbol`; only enabled when market is open. |
| `frontend/src/hooks/useMarketSocket.ts` | Opens Socket.IO connection, subscribes to the current symbol room, forwards matching updates, handles `market:closed`, refetches history on socket reconnect to heal any missed gap, and disconnects on cleanup. |

### Components

| File | Responsibility |
|---|---|
| `frontend/src/components/Dashboard.tsx` | Main orchestration component. Handles chart type state, market status gate, symbol selection, history loading/error/empty branching, and delegates shell/header/session/live-chart rendering to dashboard subcomponents. |
| `frontend/src/components/MarketChart.tsx` | Builds ECharts options and renders the AntD chart card, dotted yesterday-close line, colored points, latest heartbeat point, backend-timezone-aware tooltip/axis labels, and latest-value badge. Uses AntD theme tokens for non-spec chart colors. |
| `frontend/src/components/ChartTypeDropdown.tsx` | AntD Select control for switching between `INDEX` and `STOCK`. |
| `frontend/src/components/LatestValueBadge.tsx` | AntD Card/Statistic showing the latest index/stock value in the chart header, with the `Live` tag placed inline beside the statistic title. |
| `frontend/src/components/MarketClosedState.tsx` | AntD Card/Typography closed-market state with configured hours and timezone. |
| `frontend/src/components/LoadingState.tsx` | Shared AntD Card/Spin loading state component. |
| `frontend/src/components/ErrorState.tsx` | Shared AntD Card/Alert/Button error state component with retry action. |

### Dashboard Subcomponents

| File | Responsibility |
|---|---|
| `frontend/src/components/dashboard/DashboardShell.tsx` | Page-level dashboard wrapper. Renders the header and constrained body container. |
| `frontend/src/components/dashboard/DashboardHeader.tsx` | WingsFin logo/title/header copy and compact market status card. |
| `frontend/src/components/dashboard/MarketSessionCard.tsx` | Market session summary card for session hours, timezone, and selected instrument. |
| `frontend/src/components/dashboard/EmptyChartState.tsx` | Shared empty-chart AntD Card/Empty state for open-market sessions with no points. |
| `frontend/src/components/dashboard/LiveChartSection.tsx` | Owns mutable live chart points after history loads, subscribes to Socket.IO updates, advances the current minute, and passes points into `MarketChart`. |
| `frontend/src/components/dashboard/layout.ts` | Shared constrained content width class used by the dashboard shell and header. |
| `frontend/src/components/dashboard/types.ts` | Dashboard-local shared types such as `HeaderState`. |

### Types

| File | Responsibility |
|---|---|
| `frontend/src/types/market.ts` | Defines frontend copies of backend response/payload shapes: symbol type, point status, market status, symbols, chart history, chart point, and live update payload. |

### Utilities

| File | Responsibility |
|---|---|
| `frontend/src/utils/chartColors.ts` | Exports exact required chart point colors from `theme/designTokens.ts` and computes `above`, `below`, or `equal` status against the reference value. |
| `frontend/src/utils/time.ts` | Defines minute math and timezone-aware display formatting. `Asia/Dhaka` is the fallback, but chart paths pass the backend timezone explicitly. |
| `frontend/src/utils/tooltip.ts` | Formats ECharts tooltip HTML with symbol, timezone-aware time, value, reference, and change. |
| `frontend/src/utils/mergeLiveUpdate.ts` | Merges live payloads into the point series, replaces same-minute points, inserts out-of-order updates chronologically, fills gaps, and advances the line when no new tick arrives. |

### Tests

| File | Responsibility |
|---|---|
| `frontend/src/test/setup.ts` | Vitest setup file for jest-dom matchers. |
| `frontend/src/utils/chartColors.test.ts` | Tests point color/status behavior. |
| `frontend/src/utils/time.test.ts` | Tests minute epoch, fallback formatting, and explicit timezone formatting helpers. |
| `frontend/src/utils/tooltip.test.ts` | Tests tooltip formatting. |
| `frontend/src/utils/mergeLiveUpdate.test.ts` | Tests live update merge behavior, gap filling, boundary handling, out-of-order chronological insertion, and current-minute advancement. |

## Key Component Behavior

### `Dashboard`

`Dashboard` is the highest-value file to understand first because it coordinates data and state branching. It decides which state the user sees:

- Loading market status -> `LoadingState`.
- Market status error -> `ErrorState`.
- Market closed -> `MarketClosedState`.
- Market open but chart history loading -> `LoadingState`.
- Chart history error -> `ErrorState`.
- Market open with points -> `LiveChartSection`, which renders `MarketChart`.

It also picks the active symbol. If `/api/symbols` has not returned yet, it falls back to `DSEX` for `INDEX` and `GP` for `STOCK`.

The shell, header, session details, empty chart card, and live socket/chart state are intentionally split into `src/components/dashboard/*` so `Dashboard.tsx` stays focused on orchestration.

### `LiveChartSection`

`LiveChartSection` owns the mutable chart points after history loads. The initial state comes from backend history. After that:

- Socket updates from `useMarketSocket()` call `mergeLiveUpdate()`.
- A one-second interval calls `advanceToMinute()` only when the minute changes.
- `lastMinuteRef` prevents 59 unnecessary state updates per minute.
- The backend `history.timezone` is passed into live merge and minute advancement so generated minute labels match the backend market session.
- On socket reconnect, `useMarketSocket()` triggers a history refetch. Because the section's `key` includes the query's `dataUpdatedAt`, the new payload remounts `LiveChartSection` and re-seeds points from authoritative server history, healing any gap missed while the socket was disconnected. During normal operation the key is stable, so live-merged points accumulate intact.

### `MarketChart`

`MarketChart` keeps ECharts config inside `useMemo()`. It renders:

- Time x-axis from `sessionStart` to `sessionEnd`.
- Axis labels formatted with the backend-provided timezone.
- Value y-axis with scaling.
- Line series with point colors based on status.
- Dashed `yesterdayClose` mark line.
- `effectScatter` latest point with ripple heartbeat.
- Tooltip generated by `formatChartTooltip()` with the backend-provided timezone.

## Styling And Branding

The current styling split is intentional:

- AntD owns base components, interaction states, cards, select, alert, statistic, tags, loading, empty, and app-level tokens.
- Tailwind utilities own most component layout, spacing, sizing, alignment, and responsive behavior directly in JSX. The app imports full Tailwind so default scale utilities and arbitrary-value utilities are both available.
- `frontend/src/index.css` owns global CSS variables, document/app base rules, the layered hero background, the hero copy margin reset needed to override AntD reset margins, and the AntD Select internal selector that cannot be reached cleanly through component props.
- ECharts options stay in `MarketChart.tsx` because chart grid, axis, tooltip, mark line, and series colors are configured through JavaScript.

Brand values are centralized in `frontend/src/theme/designTokens.ts`. The required chart point colors are also defined there and are still validated by `chartColors.test.ts`:

- Point above reference: `#7327F5`
- Point below reference: `#F52738`
- Point equal reference: `#EE27F5`

`frontend/src/theme/antdTheme.ts` maps those local tokens into AntD theme tokens and enables AntD CSS variables with the `wf` prefix. `frontend/src/index.css` reads those variables where possible, then provides project-level semantic variables like `--brand-ink`, `--hero-foreground`, `--session-bg`, and `--error-accent`.

Fonts are loaded in `index.html`:

- Headings: Bree Serif
- Body/UI text: Open Sans

The real logo lives at `frontend/public/logo.webp` and is referenced as `/logo.webp`, which works in both Vite dev and production static builds.

### CSS Boundary

Do not treat `index.css` as the place for all component styling. Add styles in this order:

1. Prefer AntD props, semantic `classNames`, and theme tokens.
2. Use Tailwind utility classes for layout, spacing, dimensions, responsive behavior, and simple token-backed colors.
3. Use `index.css` only for global tokens/base rules, pseudo-elements, unavoidable nested vendor selectors, or narrow reset overrides such as `.brand-hero-copy`.
4. Keep ECharts visual behavior in `MarketChart.tsx` chart options.

## Environment Variables

| Variable | Default | Responsibility |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:4000` | Base URL for HTTP API calls. |
| `VITE_SOCKET_URL` | `http://localhost:4000` | Base URL for Socket.IO connection. |

Because these are Vite variables, they are read at build time for production builds.

## Important Frontend Behaviors

### Market Gate

The frontend does not fetch chart history until market status says the market is open. This prevents showing stale charts during closed-market periods.

### Chart Type Switch

When the dropdown changes:

1. `chartType` state changes.
2. `selectedSymbol` recalculates from `/api/symbols` or fallback values.
3. `useChartHistory()` refetches with a new query key.
4. `LiveChartSection` remounts because its `key` includes type, symbol, and the query's `dataUpdatedAt` (which changes on every fetch, including switches and reconnect refetches).
5. `useMarketSocket()` opens a new subscription for the selected symbol.

### Live Merge Rules

`mergeLiveUpdate()` follows the assignment rules:

- Ignore updates before session start.
- Ignore updates at or after session end.
- Replace the existing point if an update arrives for an already-visible minute.
- Insert an out-of-order update before later points so the ECharts series stays chronological.
- Fill missing minutes with the previous value before appending a future minute.
- Format generated minute labels with the backend-provided timezone.

### Time Display

`formatMinute()` and `formatDisplayTime()` accept an explicit timezone. `Asia/Dhaka` remains the fallback, but the chart passes `history.timezone` from the backend into axis labels, tooltip formatting, live merge, and minute advancement. This keeps the UI aligned if `MARKET_TIMEZONE` changes.

## Common Frontend Commands

```bash
cd frontend
npm install
npm run dev
npm run lint
npm test
npm run build
```

The Vite dev server normally runs at `http://localhost:5173`.

## Where To Change Things

| Need | Change Here |
|---|---|
| Change API host | `.env` or `.env.example`, values consumed by `src/api/client.ts`. |
| Change app/provider setup | `src/providers/AppProviders.tsx`. |
| Change AntD theme tokens | `src/theme/designTokens.ts` and `src/theme/antdTheme.ts`. |
| Change dashboard layout/spacing | Tailwind/AntD `className` and `classNames` usage in `src/components/dashboard/*`, `src/components/Dashboard.tsx`, and `src/components/MarketChart.tsx`. |
| Change global CSS variables or unavoidable nested selectors | `src/index.css`. |
| Change chart options | `src/components/MarketChart.tsx`. |
| Change point colors | `src/theme/designTokens.ts`, `src/utils/chartColors.ts`, and related tests. |
| Change live merge behavior | `src/utils/mergeLiveUpdate.ts` and related tests. |
| Change time display | `src/utils/time.ts` and related tests. |
| Add a new API call | Add to `src/api/*`, then wrap with a hook if React Query caching is needed. |
| Add a new screen state | Usually starts in `Dashboard.tsx` with a small component in `src/components` or `src/components/dashboard`. |
