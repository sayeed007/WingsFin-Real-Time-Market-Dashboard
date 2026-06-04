# Frontend Code Analysis

This file explains the frontend codebase from the point of view of a new engineer reading the project. The frontend is a Vite + React + TypeScript app that displays market status, fetches normalized history, subscribes to live Socket.IO updates, and renders the chart with ECharts.

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
  -> QueryClientProvider
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
  -> Dashboard.handleUpdate receives payload
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
| `frontend/vite.config.ts` | Vite config with React plugin, Vitest jsdom setup, and raised chunk warning limit for ECharts. |
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
| `frontend/src/main.tsx` | React entrypoint. Imports global CSS and renders `<App />` inside `StrictMode`. |
| `frontend/src/App.tsx` | Creates a TanStack Query client and provides it to the dashboard. |
| `frontend/src/index.css` | Global visual system and all dashboard styling: WingsFin colors, fonts, layout, chart panel, status states, responsive behavior, and controls. |

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
| `frontend/src/hooks/useMarketSocket.ts` | Opens Socket.IO connection, subscribes to the current symbol room, forwards matching updates, handles `market:closed`, and disconnects on cleanup. |

### Components

| File | Responsibility |
|---|---|
| `frontend/src/components/Dashboard.tsx` | Main orchestration component. Handles chart type state, market status gate, symbol selection, history loading, socket updates, backend timezone propagation, minute advancement, and layout. |
| `frontend/src/components/MarketChart.tsx` | Builds ECharts options and renders the line chart, dotted yesterday-close line, colored points, latest heartbeat point, backend-timezone-aware tooltip/axis labels, and latest-value badge. |
| `frontend/src/components/ChartTypeDropdown.tsx` | Select control for switching between `INDEX` and `STOCK`. |
| `frontend/src/components/LatestValueBadge.tsx` | Shows the latest index/stock value in the chart header. |
| `frontend/src/components/MarketClosedState.tsx` | Renders the closed-market state with configured hours and timezone. |
| `frontend/src/components/LoadingState.tsx` | Shared loading state component. |
| `frontend/src/components/ErrorState.tsx` | Shared error state component with retry button. |

### Types

| File | Responsibility |
|---|---|
| `frontend/src/types/market.ts` | Defines frontend copies of backend response/payload shapes: symbol type, point status, market status, symbols, chart history, chart point, and live update payload. |

### Utilities

| File | Responsibility |
|---|---|
| `frontend/src/utils/chartColors.ts` | Defines exact required chart point colors and computes `above`, `below`, or `equal` status against the reference value. |
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

`Dashboard` is the highest-value file to understand first. It decides which state the user sees:

- Loading market status -> `LoadingState`.
- Market status error -> `ErrorState`.
- Market closed -> `MarketClosedState`.
- Market open but chart history loading -> `LoadingState`.
- Chart history error -> `ErrorState`.
- Market open with points -> `LiveChartSection` and `MarketChart`.

It also picks the active symbol. If `/api/symbols` has not returned yet, it falls back to `DSEX` for `INDEX` and `GP` for `STOCK`.

### `LiveChartSection`

`LiveChartSection` owns the mutable chart points after history loads. The initial state comes from backend history. After that:

- Socket updates call `mergeLiveUpdate()`.
- A one-second interval calls `advanceToMinute()` only when the minute changes.
- `lastMinuteRef` prevents 59 unnecessary state updates per minute.
- The backend `history.timezone` is passed into live merge and minute advancement so generated minute labels match the backend market session.

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

The visual system is in `frontend/src/index.css`.

Important brand values:

- Primary ink: `#282B2A`
- Green: `#4EB648`
- Deep green: `#359F2F`
- Text gray: `#7A7A7A`
- Point above reference: `#7327F5`
- Point below reference: `#F52738`
- Point equal reference: `#EE27F5`

Fonts are loaded in `index.html`:

- Headings: Bree Serif
- Body/UI text: Open Sans

The real logo lives at `frontend/public/logo.webp` and is referenced as `/logo.webp`, which works in both Vite dev and production static builds.

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
4. `LiveChartSection` remounts because its `key` includes type, symbol, and current minute.
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
| Change dashboard layout/visual style | `src/index.css` and `src/components/Dashboard.tsx`. |
| Change chart options | `src/components/MarketChart.tsx`. |
| Change point colors | `src/utils/chartColors.ts` and related tests. |
| Change live merge behavior | `src/utils/mergeLiveUpdate.ts` and related tests. |
| Change time display | `src/utils/time.ts` and related tests. |
| Add a new API call | Add to `src/api/*`, then wrap with a hook if React Query caching is needed. |
| Add a new screen state | Usually starts in `Dashboard.tsx` with a small component in `src/components`. |
