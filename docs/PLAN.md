# WingsFin Real-Time Market Dashboard Implementation Plan

## Summary
Build a greenfield monorepo in `d:\WingsFin-Test` with:
- `frontend`: Vite + React + TypeScript + ECharts
- `backend`: Express + TypeScript + Prisma + PostgreSQL + Socket.IO
- Root Docker Compose for `frontend`, `backend`, and `postgres`
- Assignment-ready docs: `README.md`, `docs/architecture.md`, `docs/demo-script.md`

The system will show either the default `DSEX` index chart or `GP` stock chart only during configured market hours, using 1-minute normalized history plus irregular live updates.

## Key Implementation Changes
- Backend:
  - Add Express REST API under `/api`:
    - `GET /api/health`
    - `GET /api/market/status`
    - `GET /api/symbols`
    - `GET /api/chart/history?type=INDEX&symbol=DSEX`
    - `POST /api/simulate/index`
    - `POST /api/simulate/stock`
  - Add Prisma schema with `symbols` and `market_ticks`, including symbol/time indexes.
  - Add timezone-aware market service using `MARKET_TIMEZONE`, `MARKET_OPEN_TIME`, and `MARKET_CLOSE_TIME`.
  - Add chart normalization service that returns one point per minute from session open to current minute, forward-filling gaps and using the latest tick within each minute.
  - Add Socket.IO subscription handling so clients receive only subscribed symbol updates.
  - Add simulator service that generates irregular updates for `DSEX` and `GP` at unequal intervals up to 3 seconds, only while market is open.
  - Add seed script for non-uniform historical data with missing minutes and repeated ticks in some minutes.

- Frontend:
  - Add dashboard with market status gate.
  - If market is closed, show a clear closed-market message instead of charts.
  - If market is open, show chart type dropdown with `Index` selected by default.
  - Fetch normalized history with TanStack Query.
  - Connect to Socket.IO for live updates and cleanly disconnect/resubscribe on chart switch or unmount.
  - Render ECharts line chart with:
    - full-session x-axis from market open to close
    - 1-minute points up to current minute
    - dotted yesterday-close reference line
    - exact point colors: `#7327F5`, `#F52738`, `#EE27F5`
    - latest value in top-right
    - tooltip with time, value, reference, and change
    - latest-point heartbeat/blink behavior
  - Add live merge logic that replaces same-minute updates, fills missing minutes, and advances the current minute even when no new tick arrives.

- Infrastructure and docs:
  - Add root `.env.example`, backend `.env.example`, and frontend `.env.example`.
  - Add backend and frontend Dockerfiles.
  - Add `docker-compose.yml` so `docker compose up --build` starts the full system.
  - Add `README.md` with setup, seed, test, market-closed testing, manual update curl examples, and demo links/placeholders.
  - Add `docs/architecture.md` with Mermaid architecture and sequence diagrams.
  - Add `docs/demo-script.md` for the submission video.

## Public Interfaces and Types
- Market status response:
  - `isOpen`, `timezone`, `marketOpenTime`, `marketCloseTime`, `sessionStart`, `sessionEnd`, `currentTime`, optional `message`.
- Chart history response:
  - `symbol`, `type`, `isMarketOpen`, `timezone`, `sessionStart`, `sessionEnd`, `currentMinute`, `yesterdayClose`, `latestValue`, `points`.
- Chart point:
  - `time`, `minute`, `value`, `status`.
  - `status` is exactly `above`, `below`, or `equal`.
- Socket.IO events:
  - Client emits `subscribe` with `{ type, symbol }`.
  - Server emits `market:update` with `{ symbol, type, time, minuteTime, value, yesterdayClose, status }`.
  - Server emits `market:closed` when the configured session closes.

## Test Plan
- Backend unit tests with Vitest:
  - Market open, before-open closed, after-close closed, timezone handling.
  - Normalization forward-fills missing minutes.
  - Multiple ticks in one minute use the latest event time.
  - Initial empty data falls back to yesterday close.
  - Status calculation returns `above`, `below`, and `equal`.
  - Valid/invalid index and stock simulation payloads.
- Frontend tests with Vitest + React Testing Library:
  - Closed-market message renders.
  - Dropdown defaults to Index.
  - Switching to Stock triggers stock history load.
  - Latest value display renders.
  - Tooltip formatting helper returns expected values.
  - Live merge replaces same-minute data and fills missing minutes.
- Manual acceptance:
  - `docker compose up --build` starts all services.
  - Frontend opens at `http://localhost:5173`.
  - Backend health works at `http://localhost:4000/api/health`.
  - Seeded history appears.
  - Live updates arrive within 3 seconds.
  - Dropdown switch, reference line, point colors, tooltip, latest value, heartbeat point, and closed-market state all work.

## Assumptions
- Use `npm` because Node `v22.19.0` and npm `11.8.0` are available locally.
- Use TypeScript across frontend and backend.
- Use Prisma for migrations, typed queries, and seeding.
- Use Socket.IO for realtime subscriptions and reconnect behavior.
- Use ECharts as selected for chart rendering.
- Default symbols are `DSEX` for index and `GP` for stock.
- Default market config remains `Asia/Dhaka`, `10:00` open, and `14:30` close; README will explain how to adjust env values to test open and closed states.
- No core business API will be implemented in the frontend; all market data and simulation boundaries live in the Express backend.
