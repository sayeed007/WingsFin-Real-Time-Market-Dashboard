# Demo Script

Use this script when recording the submission demo video. Suggested total length: 3–5 minutes.

## 1. Project Overview (0:00 – 0:30)

- Show the repository root in a terminal or file explorer.
- Point out the monorepo structure: `frontend/`, `backend/`, `docker-compose.yml`, `docs/`.
- Briefly mention: "This is a React + Express + PostgreSQL real-time market dashboard, fully dockerized."

## 2. Start the System (0:30 – 1:00)

```bash
cp .env.example .env
docker compose up --build
```

- Show the terminal output: Postgres healthcheck, Prisma migrations, seed data generation, backend startup.
- Point out: "The backend seeds non-uniform historical data on startup for demo purposes."

## 3. Market Open State (1:00 – 1:30)

- Open http://localhost:5173 in the browser.
- Show the dashboard header with "Market Status: Open" in green.
- Show the dropdown defaulting to "Index".
- Say: "The default chart type is Index, showing the DSEX index."

## 4. Chart Features (1:30 – 2:30)

- Point out the **historical data** already plotted from market open to current minute.
- Show the **dotted yesterday-close reference line** and explain the color scheme:
  - Purple points above the reference line.
  - Red points below.
  - Pink points at the reference.
- Show the **latest value badge** in the top-right corner of the chart panel.
- Hover over a chart point to show the **tooltip** with time, value, reference, and change.
- Point out the **blinking/heartbeat animation** on the latest data point.
- Wait a few seconds to show **live updates arriving** — the chart point moves and the latest value updates.

## 5. Switch to Stock (2:30 – 3:00)

- Change the dropdown from "Index" to "Stock".
- Show the GP stock chart loading with its own historical data and live updates.
- Point out that the socket subscription switches automatically.

## 6. Manual Update (3:00 – 3:30)

- Open a second terminal.
- Run the curl command from the README to send a manual index or stock update.
- Show the chart updating immediately in the browser.

## 7. Market Closed State (3:30 – 4:00)

- Stop Docker Compose.
- Edit `.env` to set `MARKET_CLOSE_TIME=10:01` (or a time that has already passed).
- Restart with `docker compose up --build`.
- Show the dashboard displaying "Market is currently closed" with market hours.

## 8. Wrap Up (4:00 – 4:30)

- Mention the architecture document in `docs/architecture.md`.
- Mention that tests can be run with `npm test` in both `backend/` and `frontend/`.
- Say: "The full system runs with a single `docker compose up --build` command."
