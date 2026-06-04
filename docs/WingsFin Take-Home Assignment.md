## **WingsFin Take-Home Assignment — Complete Agent Build Context** 

You are building a full-stack real-time market data visualization system for the WingsFin Senior Full Stack Engineer take-home assignment. 

The goal is to implement a production-quality, dockerized system that displays real-time line charts for: 

1. An index value, example: `DSEX` 

2. A stock price, example: `GP` 

The solution must include: 

- React.js frontend 

- Node.js backend 

- PostgreSQL database 

- Real-time updates 

- Historical data seeding 

- Live data simulation 

- Docker Compose setup 

- Architecture diagram 

- Architecture/design decision document 

- README with setup and testing instructions 

- Demo-ready behavior 

The final project should be understandable, clean, scalable, testable, and easy to run with: 

```
dockercomposeup--build
```

## **1. Product Goal** 

Build a real-time market charting dashboard that allows a user to view either: 

- A real-time index chart, default selected • A real-time stock chart 

The charts must show market data only when the market is open. If the market is closed, the page should show an appropriate closed-market message instead of charts. 

Market open and close time must be configurable through environment variables or config files. 

1 

The system must simulate real-world market data behavior where updates arrive irregularly, not at fixed intervals. 

## **2. Required User Experience** 

## **2.1 Page States** 

The frontend dashboard must support these states: 

## **State 1: Market Closed** 

When the current time is outside the configured market open/close window: 

- Do not render the chart. 

- Show a clear message such as: 

```
Market is currently closed.
Market hours: 10:00 AM – 2:30 PM
```

- The UI should still load successfully. 

- 

- The dropdown may be shown or hidden, but the user should clearly understand why there is no chart. 

## **State 2: Market Open** 

When the current time is inside the configured market session: 

- Show a dropdown to choose chart type: 

- `Index` 

- 

- `Stock` 

- 

- Default selection: `Index` 

- 

- Render the selected chart. 

- 

- Load historical data from market open time up to the current minute. 

- 

- Continue receiving and displaying live updates until: 

- the user leaves the page, or 

- the market closes. 

2 

## **3. Core Chart Rules** 

## **3.1 Timeline** 

When market is open: 

- The x-axis timeline must represent the full market session. • Example: 

- Market open: `10:00` 

- Market close: `14:30` 

- X-axis domain must span `10:00` to `14:30` 

- Timeline granularity must be exactly `1 minute` . 

- There must be no missing minutes from market open up to the current minute. 

- The latest point on the chart must always represent the current minute. 

- Future minutes may appear as empty x-axis space if the charting library supports full-session domain display. 

## **3.2 Historical Initial Load** 

If a user opens the dashboard during market hours: 

- Fetch historical data from market open time up to the current minute. 

- 

- Convert irregular raw updates into normalized 1-minute chart points. 

- If no new update exists for a minute, carry forward the latest known value. 

- If multiple updates occur inside the same minute, use the latest update for that minute. 

- If no update exists yet after market open, use a safe fallback: 

- Prefer the latest known value before market open. 

- If unavailable, use yesterday’s close as the starting value. 

## **3.3 Live Updates** 

During market hours: 

- Backend receives or generates updates irregularly. 

- Updates should be pushed to connected clients instantly. 

- Frontend should update the chart without page reload. 

- If multiple updates arrive in the same minute: 

- Replace the current minute’s value with the latest update. 

- If no update arrives in a minute: 

- The latest known value remains unchanged. 

- The current minute should still exist on the chart. 

- The chart must never skip a minute between market open and the current minute. 

- Live updates should stop automatically when market closes. 

3 

## **4. Data Payloads** 

## **4.1 Index Update Payload** 

The source sends index updates like: 

```
{
"index_id":"DSEX",
"time":1779336701000,
"capital_value":5222.22,
"percentage_change_from_yesterday_close_value":4.12
}
```

Interpretation: 

- 

- 

- 

- `index_id` : index symbol, for example `DSEX` 

- `time` : Unix timestamp in milliseconds 

- `capital_value` : current index value 

- `percentage_change_from_yesterday_close_value` : percentage change relative to yesterday 

- close 

For index yesterday close: 

```
yesterday_close_value = capital_value / (1 +
percentage_change_from_yesterday_close_value / 100)
```

Store this as the reference line value for the index. 

## **4.2 Stock Update Payload** 

The source sends stock updates like: 

```
{
"trade_code":"GP",
"time":1779336913000,
"close_price":238.79,
"yesterday_close_price":238.88
}
```

Interpretation: 

- `trade_code` : stock symbol, for example `GP` 

4 

- `time` : Unix timestamp in milliseconds 

- `close_price` : latest stock price 

- `yesterday_close_price` : reference line value 

## **5. Visual Requirements** 

Each chart must include: 

## **5.1 Dotted Reference Line** 

- Show a dotted horizontal reference line. 

- For stock chart: 

- Reference line = `yesterday_close_price` 

- For index chart: 

- Reference line = computed `yesterday_close_value` 

## **5.2 Point Colors** 

Every chart point must be colored based on comparison with yesterday close: 

- Above yesterday close: `#7327F5` 

- Below yesterday close: `#F52738` 

- Equal to yesterday close: `#EE27F5` 

Use exact color values. 

## **5.3 Latest Point Animation** 

The latest chart point must have a blinking or heartbeat animation. 

Acceptance behavior: 

- Only the newest point should animate. 

- 

- When a new minute begins, animation should move to the new latest point. 

- 

- When multiple updates arrive in same minute, the same latest point should update and keep animating. 

## **5.4 Tooltip** 

Hovering over a point must show: 

- Time 

- Value or price 

- Optional: symbol/index id 

5 

- Optional: difference from yesterday close • Optional: percentage change 

Example tooltip: 

```
Time: 10:37 AM
Value: 5222.22
Reference: 5200.00
Change: +22.22
```

## **5.5 Latest Value Display** 

The latest value or price must be displayed in the top-right corner of the chart container. 

Example: 

```
Latest: 5222.22
```

For stock: 

```
Latest Price: 238.79
```

## **6. Recommended Technology Choices** 

Use this stack unless there is a strong reason not to: 

## **Frontend** 

- React.js 

- TypeScript 

- Vite 

- Recharts or Apache ECharts 

- Socket.IO client or native WebSocket client 

- React Query or TanStack Query for initial historical fetch 

- CSS Modules, Tailwind CSS, or clean plain CSS 

Recommended: React + Vite + TypeScript + Recharts. 

Reason: 

- Fast development 

6 

- Low TTI 

- Good line chart support 

- Easy custom dots, tooltips, reference lines 

## **Backend** 

- Node.js 

- TypeScript 

- Express.js or Fastify 

- Socket.IO or native WebSocket 

- Prisma ORM or node-postgres 

- Zod for payload validation 

- PostgreSQL 

Recommended: Node.js + TypeScript + Fastify or Express + Socket.IO + Prisma. 

Reason: 

- Simple realtime implementation 

- Easy Docker setup 

- Good scalability path 

- Clean schema migrations 

## **Database** 

- PostgreSQL • Prisma migrations or SQL migrations 

## **Infrastructure** 

- Docker 

- Docker Compose 

Services: 

1. `frontend` 

2. `backend` 

3. `postgres` 

Optional: 

1. `pgadmin` , only if helpful, but not required 

7 

## **7. High-Level Architecture** 

Use this architecture: 

```
+----------------------+
| Data Simulator       |
| Irregular updates    |
| <= 3 sec interval    |
+----------+-----------+
           |
           v
+----------------------+
| Node.js Backend      |
| - REST API           |
| - WebSocket Gateway  |
| - Market Status      |
| - Minute Normalizer  |
| - Data Validation    |
+----------+-----------+
           |
           v
+----------------------+
| PostgreSQL           |
| - Raw updates        |
| - Symbols            |
| - Reference values   |
+----------+-----------+
           ^
           |
+----------+-----------+
| React Frontend       |
| - Dropdown           |
| - Historical fetch   |
| - Realtime socket    |
| - 1-minute chart     |
+----------------------+
```

## **8. Backend Responsibilities** 

The backend must: 

1. Expose market status. 

2. Store raw index and stock updates. 

8 

3. Validate incoming simulated/source updates. 

4. Provide normalized historical chart data in 1-minute intervals. 

5. Push live updates to clients in real time. 

6. Stop or ignore live chart updates when market is closed. 

7. Support non-uniform seed data. 

8. Support arbitrary live simulation with unequal intervals <= 3 seconds. 

9. Be configurable through environment variables. 

## **9. Frontend Responsibilities** 

The frontend must: 

1. Check market status on load. 

2. If market is closed, show closed message. 

3. If market is open: 

4. show chart type dropdown 

5. default to index 

6. fetch historical chart data 

7. connect to live updates 

8. Render full market session x-axis. 

9. Normalize or safely merge live updates into current minute. 

10. Display no missing minutes from market open to current minute. 

11. Render reference dotted line. 

12. Render colored points. 

13. Animate latest point. 

14. Show tooltip on hover. 

15. Show latest value in top-right. 

16. Disconnect socket when user leaves page/component unmounts. 

## **10. Environment Variables** 

Create `.env.example` files. 

## **Backend** **`.env.example`** 

```
NODE_ENV=development
PORT=4000
```

```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/wingsfin
```

9 

```
MARKET_TIMEZONE=Asia/Dhaka
MARKET_OPEN_TIME=10:00
MARKET_CLOSE_TIME=14:30
DEFAULT_INDEX_ID=DSEX
DEFAULT_STOCK_TRADE_CODE=GP
INDEX_YESTERDAY_CLOSE=5200
STOCK_YESTERDAY_CLOSE=238.88
```

```
SIMULATOR_ENABLED=true
SIMULATOR_MIN_INTERVAL_MS=300
SIMULATOR_MAX_INTERVAL_MS=3000
```

```
CORS_ORIGIN=http://localhost:5173
```

## **Frontend** **`.env.example`** 

```
VITE_API_BASE_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

## **11. Database Design** 

Implement a PostgreSQL schema that supports both raw updates and chart querying. 

Recommended schema: 

## **11.1** **`symbols`** 

Stores available chart instruments. 

```
CREATETYPEsymbol_typeASENUM('INDEX','STOCK');
```

```
CREATETABLEsymbols(
idUUIDPRIMARYKEYDEFAULTgen_random_uuid(),
symbolVARCHAR(32)NOTNULLUNIQUE,
typesymbol_typeNOTNULL,
display_nameVARCHAR(128),
yesterday_closeNUMERIC(14,4)NOTNULL,
created_atTIMESTAMPTZNOTNULLDEFAULTNOW(),
```

10 

```
updated_atTIMESTAMPTZNOTNULLDEFAULTNOW()
);
```

Seed: 

```
DSEX, type INDEX
GP, type STOCK
```

## **11.2** **`market_ticks`** 

Stores every raw update. 

```
CREATETABLEmarket_ticks(
idBIGSERIALPRIMARYKEY,
symbolVARCHAR(32)NOTNULLREFERENCESsymbols(symbol),
typesymbol_typeNOTNULL,
event_timeTIMESTAMPTZNOTNULL,
valueNUMERIC(14,4)NOTNULL,
yesterday_closeNUMERIC(14,4)NOTNULL,
raw_payloadJSONBNOTNULL,
created_atTIMESTAMPTZNOTNULLDEFAULTNOW()
);
CREATEINDEXidx_market_ticks_symbol_time
ONmarket_ticks(symbol,event_timeDESC);
CREATEINDEXidx_market_ticks_event_time
ONmarket_ticks(event_timeDESC);
```

## **11.3 Why Store Raw Updates?** 

Because source updates are irregular and multiple updates can arrive in the same minute. 

Raw storage allows: 

- Accurate audit trail 

- Rebuilding chart data 

- Debugging 

- Testing aggregation logic 

- Future analytics 

11 

## **12. API Design** 

Base URL: 

```
http://localhost:4000/api
```

## **12.1 Health Check** 

```
GET /api/health
```

Response: 

```
{
"status":"ok",
"time":"2026-06-03T10:30:00.000Z"
}
```

## **12.2 Market Status** 

```
GET /api/market/status
```

Response when open: 

```
{
"isOpen":true,
"timezone":"Asia/Dhaka",
"marketOpenTime":"10:00",
"marketCloseTime":"14:30",
"sessionStart":"2026-06-03T10:00:00+06:00",
"sessionEnd":"2026-06-03T14:30:00+06:00",
"currentTime":"2026-06-03T11:22:00+06:00"
```

```
}
```

Response when closed: 

```
{
```

```
"isOpen":false,
"timezone":"Asia/Dhaka",
"marketOpenTime":"10:00",
```

12 

```
"marketCloseTime":"14:30",
"sessionStart":"2026-06-03T10:00:00+06:00",
"sessionEnd":"2026-06-03T14:30:00+06:00",
"currentTime":"2026-06-03T15:30:00+06:00",
"message":"Market is currently closed."
}
```

## **12.3 List Symbols** 

```
GET /api/symbols
```

Response: 

```
{
"symbols":[
{
"symbol":"DSEX",
"type":"INDEX",
"displayName":"DSEX Index",
"yesterdayClose":5200
},
{
"symbol":"GP",
"type":"STOCK",
"displayName":"GP",
"yesterdayClose":238.88
}
]
}
```

## **12.4 Historical Chart Data** 

```
GET /api/chart/history?type=INDEX&symbol=DSEX
```

or: 

```
GET /api/chart/history?type=STOCK&symbol=GP
```

Response: 

13 

```
{
"symbol":"DSEX",
"type":"INDEX",
"isMarketOpen":true,
"timezone":"Asia/Dhaka",
"sessionStart":"2026-06-03T10:00:00+06:00",
"sessionEnd":"2026-06-03T14:30:00+06:00",
"currentMinute":"2026-06-03T11:22:00+06:00",
"yesterdayClose":5200,
"latestValue":5222.22,
"points":[
{
"time":"2026-06-03T10:00:00+06:00",
"minute":"10:00",
"value":5201.25,
"status":"above"
},
{
"time":"2026-06-03T10:01:00+06:00",
"minute":"10:01",
"value":5201.25,
"status":"above"
}
]
}
```

Important: 

- `points` must contain one point per minute from session start to current minute. 

- • Do not skip minutes. • If multiple raw records exist for a minute, use the latest one by `event_time` . • If no record exists for a minute, forward-fill from the previous known value. 

- `status` must be one of: 

- `above` 

- 

- 

- `below` 

- `equal` 

## **12.5 Manual Simulation Endpoint** 

Useful for testing arbitrary updates. 

14 

## **Index** 

```
POST /api/simulate/index
Content-Type: application/json
```

Body: 

```
{
"index_id":"DSEX",
"capital_value":5222.22,
"percentage_change_from_yesterday_close_value":4.12
}
```

The backend should add current server time if `time` is omitted. 

## **Stock** 

```
POST /api/simulate/stock
Content-Type: application/json
```

Body: 

```
{
"trade_code":"GP",
"close_price":238.79,
"yesterday_close_price":238.88
}
```

The backend should add current server time if `time` is omitted. 

## **13. WebSocket / Socket.IO Design** 

Use Socket.IO unless native WebSocket is preferred. 

## **13.1 Client Connect** 

Frontend connects to: 

15 

```
ws://localhost:4000
```

or Socket.IO equivalent. 

## **13.2 Subscribe Event** 

Client sends: 

```
{
"event":"subscribe",
"payload":{
"type":"INDEX",
"symbol":"DSEX"
}
}
```

When user switches dropdown to stock: 

```
{
"event":"subscribe",
"payload":{
"type":"STOCK",
"symbol":"GP"
}
}
```

The client should unsubscribe from previous symbol or server should replace previous subscription. 

## **13.3 Live Update Event** 

Server emits: 

```
{
"event":"market:update",
"payload":{
"symbol":"DSEX",
"type":"INDEX",
"time":"2026-06-03T11:22:34+06:00",
"minuteTime":"2026-06-03T11:22:00+06:00",
"value":5222.22,
"yesterdayClose":5200,
"status":"above"
```

16 

```
}
}
```

For stock: 

```
{
"event":"market:update",
"payload":{
"symbol":"GP",
"type":"STOCK",
"time":"2026-06-03T11:22:34+06:00",
"minuteTime":"2026-06-03T11:22:00+06:00",
"value":238.79,
"yesterdayClose":238.88,
"status":"below"
}
}
```

## **13.4 Market Closed Event** 

When market closes, server emits: 

```
{
"event":"market:closed",
"payload":{
"message":"Market is now closed.",
"closedAt":"2026-06-03T14:30:00+06:00"
}
}
```

Frontend should: 

- Stop showing the chart, or freeze chart and show closed overlay. 

- Prefer assignment behavior: show closed-market message instead of charts. 

## **14. Minute Normalization Algorithm** 

Implement a shared backend service called something like `ChartDataService` . 

Input: 

- Symbol 

17 

- Type 

- Session start 

- Current time 

- Raw ticks from DB 

Output: 

• One chart point per minute from market open to current minute 

Algorithm: 

`1. Determine sessionStart and sessionEnd from config and timezone.` 

`2. Determine currentMinute = floor current time to minute.` 

```
3. Query raw ticks for selected symbol where:
   event_time >= sessionStart
   event_time <= currentMinute + 59 seconds
4. Also query the latest tick before sessionStart for fallback.
5. Group ticks by minute.
6. For each minute:
   a. If one or more ticks exist in that minute:
      - choose the tick with greatest event_time
      - currentValue = tick.value
   b. Else:
      - currentValue = previousValue
   c. If previousValue is null:
      - use latest tick before sessionStart if available
      - else use yesterdayClose
   d. Create point with:
      - time
      - minute label
      - value
      - status compared with yesterdayClose
7. Return points.
```

Important: 

• Use timezone-aware date handling. • Use `luxon` or `date-fns-tz` . • Do not rely on server local timezone. • Always use configured `MARKET_TIMEZONE` . 

## **15. Live Update Merge Algorithm on Frontend** 

When a live update arrives: 

18 

```
1. Convert update time to minute bucket.
```

`2. If update minute is less than market open or greater than market close, ignore.` 

`3. If update minute equals an existing point:` 

- `replace that point's value with latest update value.` 

`4. If update minute is after the last point: - fill every missing minute between last point and update minute using previous value.` 

- `append the update minute point.` 

`5. Ensure latest point is always current minute:` 

- `run a lightweight 1-minute timer. - when minute changes and no update arrived, append new minute with previous value.` 

`6. Recompute status above/below/equal.` 

`7. Update latest value display.` 

## **16. Data Simulation Requirements** 

Implement a simulator that generates irregular live updates. 

## **16.1 Rules** 

- Updates must arrive at unequal intervals. 

- Each interval must be less than or equal to 3 seconds. 

- Use random interval between configured min and max. 

- 

- Generate updates for both: 

- 

- `DSEX` 

- `GP` 

- Only generate updates when market is open. 

- 

- Stop generating when market is closed. 

## **16.2 Index Simulation** 

For index: 

- Use configured yesterday close, for example `5200` . 

- • Generated value should fluctuate between: 

- yesterday close - 100 

- 

- yesterday close + 100 

- 

- This makes line color changes visible. 

Example: 

19 

```
INDEX_YESTERDAY_CLOSE=5200
Allowed range: 5100 to 5300
```

## **16.3 Stock Simulation** 

For stock: 

- Use configured yesterday close, for example `238.88` . 

- Generated value should fluctuate between: 

- yesterday close - 1 • yesterday close + 1 

Example: 

```
STOCK_YESTERDAY_CLOSE=238.88
Allowed range: 237.88 to 239.88
```

## **16.4 Random Walk** 

Prefer a random-walk style simulation instead of fully random jumps. 

Example logic: 

```
nextValue = previousValue + randomDelta
clamp nextValue to allowed min/max
```

For index: 

```
randomDelta between -10 and +10
```

For stock: 

```
randomDelta between -0.1 and +0.1
```

This produces realistic fluctuation. 

20 

## **17. Seed Data Requirements** 

Implement seed scripts that create historical data for testing mid-market scenarios. 

Seed data must: 

- Include both index and stock data. 

- Simulate a market session from market open up to a configurable seed current time. 

- Use non-uniform update intervals. 

- Include multiple updates in some minutes. 

- Include missing minutes with no update. 

- Include values above, below, and equal or near equal to yesterday close. 

- Allow the frontend to demonstrate forward-fill behavior. 

- Allow color changes on the line/points. 

Example seed script command: 

```
pnpmseed
```

or: 

```
dockercomposeexecbackendpnpmseed
```

Optional env: 

```
SEED_DATE=2026-06-03
SEED_UNTIL_TIME=11:30
```

Seed script should: 

1. Clear old test ticks for `DSEX` and `GP` . 

2. Ensure symbols exist. 

3. Generate irregular ticks from market open to seed until time. 

4. Insert raw ticks into `market_ticks` . 

## **18. Frontend UI Details** 

## **18.1 Layout** 

Create a clean dashboard page. 

21 

Suggested layout: 

```
+------------------------------------------------------+
| WingsFin Real-Time Market Dashboard                  |
| Market Status: Open                                  |
+------------------------------------------------------+
| Chart Type: [ Index v ]                              |
+------------------------------------------------------+
| DSEX Index                              Latest: 5222 |
|                                                      |
|                  Line Chart                          |
|                                                      |
+------------------------------------------------------+
```

## **18.2 Components** 

Recommended components: 

```
src/
  components/
    ChartTypeDropdown.tsx
    MarketChart.tsx
    MarketClosedState.tsx
    LatestValueBadge.tsx
    ChartTooltip.tsx
    LoadingState.tsx
    ErrorState.tsx
  hooks/
    useMarketStatus.ts
    useChartHistory.ts
    useMarketSocket.ts
    useMinuteTicker.ts
  utils/
    chartColors.ts
    time.ts
    normalizeLivePoint.ts
```

## **18.3 Dropdown Behavior** 

Dropdown options: 

22 

```
Index
Stock
```

Default: 

```
Index
```

When user switches: 

1. Disconnect or update socket subscription. 

2. Fetch historical data for selected type/symbol. 

3. Render new chart. 

4. Show latest value for selected chart. 

## **18.4 Loading State** 

While historical data is loading: 

```
Loading chart data...
```

## **18.5 Error State** 

If API fails: 

```
Could not load chart data. Please try again.
```

Include retry button if possible. 

## **19. Chart Implementation Details** 

Recommended Recharts setup: 

Use: 

- `LineChart` 

- `Line` 

- `XAxis` 

- `YAxis` 

- `Tooltip` 

23 

- `ReferenceLine` 

- `ResponsiveContainer` 

- Custom dot renderer 

Important: 

- `ReferenceLine` should be dotted. 

- Custom dot should use the required color. 

- Latest dot should have CSS animation. 

- Tooltip should show value and time. 

- X-axis should represent market session. 

If using Recharts, point color on a single `Line` may require: 

- Custom `dot` 

- Custom `activeDot` 

- Potential segmented line rendering if line color itself must visibly change by point 

Assignment says “Point colors should follow these rules,” so exact requirement is for points, not necessarily line segment color. However, making the line visually follow point state is a nice bonus. 

## **19.1 CSS Heartbeat Animation** 

Example CSS: 

```
.latest-point{
animation:heartbeat1.2sinfiniteease-in-out;
transform-origin:center;
}
@keyframesheartbeat{
0%{
r:4;
opacity:1;
}
50%{
r:8;
opacity:0.45;
}
100%{
r:4;
opacity:1;
}
}
```

24 

If SVG `r` animation does not work reliably, use transform scale or render a custom SVG circle with animation. 

## **20. Performance Requirements** 

The system should be designed so that: 

- Page load time is low. 

- Chart Time to Interactive is low. 

- Realtime updates feel instant. 

- Resource consumption does not grow significantly as users increase. 

Implementation expectations: 

## **Backend** 

- Query only required symbol and time range. 

- Index DB by symbol and event time. 

- Broadcast only to subscribed clients. 

- Avoid polling from frontend for live updates. 

- Use WebSocket/Socket.IO. 

- Avoid recomputing every chart for every update. 

- Store raw ticks efficiently. 

## **Frontend** 

- Fetch historical data once per selected chart. 

- Use memoization where useful. 

- Avoid re-rendering entire app for every socket event. 

- Update only chart state. 

- Cap chart points to market session minutes. 

- Use responsive chart container. 

- Avoid heavy chart libraries if unnecessary. 

## **21. Testing Requirements** 

Implement enough tests to show quality. 

25 

## **21.1 Backend Unit Tests** 

Test market status: 

- Market open returns `isOpen: true` . 

- Market closed before open returns `isOpen: false` . 

- Market closed after close returns `isOpen: false` . • Timezone is respected. 

Test normalization: 

- Missing minutes are forward-filled. 

- Multiple updates in same minute use latest event. 

- Initial missing minutes use yesterday close. 

- Latest point represents current minute. • Status is `above` , `below` , or `equal` . 

Test payload parsing: 

- Valid index payload accepted. 

- Invalid index payload rejected. 

- Valid stock payload accepted. 

- Invalid stock payload rejected. 

## **21.2 Frontend Tests** 

Use React Testing Library if time permits. 

Test: 

- Closed-market message appears when market closed. 

- Dropdown default is Index. 

- Switching dropdown loads stock chart. 

- Latest value appears. 

- Tooltip component formats values correctly. 

- Chart receives normalized points. 

## **21.3 Integration / Manual Tests** 

Document manual testing steps in README: 

1. Start project: 

```
dockercomposeup--build
```

1. Open frontend: 

26 

```
http://localhost:5173
```

1. Confirm default chart is index. 

2. Confirm historical data appears. 

3. Confirm live point updates. 

4. Confirm latest value changes. 

5. Switch to stock chart. 

6. Confirm stock data appears. 

7. Confirm point colors change based on reference line. 

8. Confirm market closed message by changing market env times. 

- Confirm seed data works. 

9. 

## **22. Acceptance Criteria** 

The implementation is complete only if all below criteria pass. 

## **22.1 Functional Acceptance Criteria** 

- [ ] App runs with `docker compose up --build` . 

- [ ] Frontend is accessible in browser. 

- [ ] Backend health endpoint works. 

- [ ] PostgreSQL starts correctly. 

- [ ] Database migrations run successfully. 

- [ ] Seed data can be generated. 

- [ ] Market open/close time is configurable. 

- 

- [ ] Market status endpoint returns correct open/closed state. 

- [ ] When market is closed, frontend shows a closed-market message. 

- [ ] When market is open, frontend shows chart UI. 

- [ ] Dropdown exists for chart type selection. 

- [ ] Default selected chart type is index. 

- [ ] User can switch from index chart to stock chart. 

- [ ] Historical data loads from market open to current minute. 

- [ ] Historical chart data is plotted at 1-minute intervals. 

- [ ] Timeline has no missing minutes up to current minute. 

- [ ] If no update arrives for a minute, previous value is carried forward. • [ ] If multiple updates arrive in same minute, latest update is used. 

- [ ] Latest chart point always represents current minute. 

- [ ] Live updates continue while market is open. 

- [ ] Live updates stop when user leaves page or disconnects. 

- [ ] Live updates stop or closed state appears when market closes. 

- [ ] Latest value appears in chart top-right corner. 

- [ ] Tooltip shows value and time. • [ ] Dotted reference line appears for yesterday close. 

- [ ] Above-reference points use color `#7327F5` . 

27 

- [ ] Below-reference points use color `#F52738` . 

- [ ] Equal-reference points use color `#EE27F5` . 

- [ ] Latest point has blinking or heartbeat animation. 

- [ ] Simulator generates index updates. 

- [ ] Simulator generates stock updates. 

- [ ] Simulator uses unequal intervals. 

- [ ] Simulator intervals are less than or equal to 3 seconds. • [ ] Index simulation fluctuates within yesterday close ±100. • [ ] Stock simulation fluctuates within yesterday close ±1. 

- [ ] Seed data uses non-uniform intervals. 

- [ ] Seed data creates mid-market historical scenario. 

## **22.2 Technical Acceptance Criteria** 

- [ ] Backend uses Node.js. 

- [ ] Frontend uses React.js. 

- [ ] Database uses PostgreSQL. 

- [ ] TypeScript is used if possible. 

- [ ] API input validation exists. 

- [ ] Environment variables are documented. 

- [ ] Backend code is modular. 

- [ ] Frontend code is componentized. 

- [ ] WebSocket subscriptions are cleaned up on unmount. 

- [ ] Database has proper indexes for symbol/time queries. 

- [ ] Dockerfiles exist for frontend and backend. 

- 

- [ ] Docker Compose includes frontend, backend, and postgres. 

- [ ] README explains setup clearly. 

- 

- [ ] README explains testing clearly. 

- [ ] README explains simulation clearly. 

- [ ] README explains market time configuration. 

- 

- [ ] Architecture diagram is included. 

- [ ] Architecture/design document is included. 

- [ ] Trade-offs and design decisions are documented. 

- 

## **22.3 Quality Acceptance Criteria** 

- [ ] No hardcoded market hours except defaults in env example. 

- [ ] No hardcoded API URLs in frontend source. 

- [ ] No missing error handling for failed API calls. 

- [ ] No memory leak from socket connection. 

- [ ] Chart does not crash if no data exists. 

- [ ] Chart handles first update after market open. 

- 

- [ ] Chart handles repeated updates within same minute. 

- [ ] Chart handles user switching chart types while updates are active. 

- [ ] Backend does not emit updates for unsubscribed symbols. 

- [ ] Backend does not generate market data outside market hours. 

- [ ] Code is readable and maintainable. 

28 

• [ ] Project can be reviewed without asking for extra clarification. 

## **23. Suggested Repository Structure** 

Use a monorepo: 

```
wingsfin-realtime-market/
  README.md
  docker-compose.yml
  .env.example
  docs/
    architecture.md
    architecture-diagram.md
    demo-script.md
  backend/
    Dockerfile
    package.json
    tsconfig.json
    .env.example
    prisma/
      schema.prisma
      migrations/
      seed.ts
    src/
      main.ts
      config/
        env.ts
        market.ts
      db/
        prisma.ts
      modules/
        health/
          health.routes.ts
        market/
          market.routes.ts
          market.service.ts
        symbols/
          symbols.routes.ts
          symbols.service.ts
        chart/
          chart.routes.ts
          chart.service.ts
```

29 

```
          chart.normalizer.ts
        simulator/
          simulator.service.ts
          simulator.routes.ts
        realtime/
          socket.server.ts
          subscription.store.ts
      validation/
        marketPayload.schema.ts
      utils/
        time.ts
        compare.ts
      tests/
        market.service.test.ts
        chart.normalizer.test.ts
  frontend/
    Dockerfile
    package.json
    tsconfig.json
    vite.config.ts
    .env.example
    src/
      main.tsx
      App.tsx
      api/
        client.ts
        marketApi.ts
        chartApi.ts
      components/
        Dashboard.tsx
        ChartTypeDropdown.tsx
        MarketChart.tsx
        MarketClosedState.tsx
        LatestValueBadge.tsx
        ChartTooltip.tsx
        LoadingState.tsx
        ErrorState.tsx
      hooks/
        useMarketStatus.ts
        useChartHistory.ts
        useMarketSocket.ts
        useMinuteTicker.ts
      types/
        market.ts
      utils/
        chartColors.ts
        time.ts
```

30 

```
        mergeLiveUpdate.ts
      styles/
        global.css
```

## **24. README Requirements** 

The README must include: 

## **24.1 Project Summary** 

Explain: 

```
This project is a real-time market visualization system for index and stock
price updates. It uses React, Node.js, PostgreSQL, Docker, and WebSocket-based
live updates.
```

## **24.2 Tech Stack** 

List: 

- React.js 

- Node.js 

- PostgreSQL 

- Docker 

- WebSocket/Socket.IO 

- Chart library 

- ORM/query library 

## **24.3 How to Run** 

```
cp.env.example.env
dockercomposeup--build
```

Then: 

```
Frontend: http://localhost:5173
Backend: http://localhost:4000
```

31 

## **24.4 How to Seed Data** 

Example: 

```
dockercomposeexecbackendpnpmseed
```

## **24.5 How to Test Market Closed State** 

Explain changing: 

```
MARKET_OPEN_TIME=10:00
MARKET_CLOSE_TIME=10:01
```

or using values outside the current time. 

## **24.6 How to Trigger Manual Updates** 

Include curl examples: 

```
curl-XPOSThttp://localhost:4000/api/simulate/index
```

   - `-H "Content-Type: application/json"` 

- `-d '{"index_id":"DSEX","capital_value":` 

- `5222.22,"percentage_change_from_yesterday_close_value":4.12}'` 

```
curl-XPOSThttp://localhost:4000/api/simulate/stock
```

- `-H "Content-Type: application/json"` 

```
-d'{"trade_code":"GP","close_price":238.79,"yesterday_close_price":238.88}'
```

## **24.7 Design Decisions** 

Briefly explain: 

- Raw ticks are stored instead of only minute aggregates. 

- Backend normalizes historical data into 1-minute points. 

- Frontend merges live updates into existing minute buckets. 

- WebSocket avoids polling and gives instant updates. 

- Market time is config-driven. 

- PostgreSQL indexing supports scalable symbol/time queries. 

32 

## **24.8 Trade-offs** 

Mention: 

- For assignment simplicity, simulator is inside backend. 

- In production, simulator/source ingestion could be separate service or message queue consumer. 

- Current setup supports a few symbols but schema can scale to many symbols. 

- Raw data storage increases storage usage but improves auditability and rebuildability. 

- WebSocket is good for real-time UX; Redis adapter could be added for multi-instance scaling. 

## **25. Architecture Document Requirements** 

Create `docs/architecture.md` 

. 

It should include: 

1. System overview 

2. Main components 

3. Data flow 

4. Historical data flow 

5. Live update flow 

6. Database design 

7. Time normalization strategy 

8. Market status handling 

9. Simulation strategy 

10. Scalability considerations 

11. Trade-offs 

12. Future improvements 

## **25.1 Example Architecture Diagram** 

Add Mermaid diagram: 

```
flowchart LR
  Simulator[Data Simulator] --> Backend[Node.js Backend]
  Backend --> Postgres[(PostgreSQL)]
  Backend --> Socket[WebSocket / Socket.IO]
  Socket --> Frontend[React Frontend]
  Frontend --> Backend
```

33 

## **25.2 More Detailed Data Flow** 

```
sequenceDiagram
  participant User
  participant Frontend
  participant Backend
  participant DB as PostgreSQL
  participant Sim as Simulator
  User->>Frontend: Open dashboard
  Frontend->>Backend: GET /api/market/status
  Backend-->>Frontend: Market open/closed
```

```
  alt Market Open
    Frontend->>Backend: GET /api/chart/history
    Backend->>DB: Query raw ticks
    Backend->>Backend: Normalize to 1-minute points
    Backend-->>Frontend: Chart points
    Frontend->>Backend: Subscribe via WebSocket
    Sim->>Backend: Push irregular update
    Backend->>DB: Store raw tick
    Backend->>Frontend: Emit live update
    Frontend->>Frontend: Merge into current minute
  else Market Closed
    Frontend->>User: Show closed market message
  end
```

## **26. Demo Video Script** 

Create `docs/demo-script.md` . 

The demo video should show: 

1. Starting the project: 

```
dockercomposeup--build
```

1. Opening frontend. 

2. Showing market open state. 

3. Showing default index chart. 

4. Showing historical data already loaded. 

5. Showing latest value in top-right. 

6. Showing blinking latest point. 

34 

7. Hovering over chart point to show tooltip. 

8. Showing dotted yesterday-close line. 

9. Showing point colors above/below/equal. 

10. Switching dropdown to stock. 

11. Showing stock chart live updates. 

12. Optionally sending manual update with curl. 

13. Showing market closed state by changing env or config. 

## **27. Edge Cases to Handle** 

The implementation must handle: 

- API down 

- DB not ready at startup 

- No historical data found 

- Market closed before open 

- Market closed after close 

- Multiple updates in same minute 

- No updates for several minutes 

- User switches chart type during active socket stream 

- Socket reconnects 

- Duplicate updates 

- Invalid payloads 

- Timezone mismatch 

- Future timestamp payload 

- Payload timestamp outside market hours 

- Yesterday close equal to current value 

- Index percentage change equals 0 

- User opens app exactly at market open 

- User opens app exactly at market close 

Recommended behavior: 

- Invalid payload: reject with 400 and useful message. 

- Timestamp outside market hours: store optionally, but do not emit to chart; simpler option is reject/ ignore for chart. 

- No historical data: generate flat line from yesterday close to current minute. 

- Socket reconnect: refetch history or resubscribe. 

35 

## **28. Security and Robustness** 

Minimum requirements: 

- Validate all request payloads. 

- Enable CORS only for configured frontend origin. 

- Do not expose database credentials in README except local defaults. 

- Use environment variables. 

- Avoid crashing simulator if DB insert fails. 

- Log errors clearly. 

- Use graceful shutdown: 

- close HTTP server 

- close DB connection 

- stop simulator timers 

## **29. Scalability Notes to Include** 

The design should mention how to scale: 

Current assignment version: 

- Single backend instance 

- In-process simulator 

- Socket.IO in same process 

- PostgreSQL stores raw updates 

Production scaling path: 

- Move data ingestion/simulator to separate worker. 

- Use Redis Pub/Sub or Kafka for update fanout. 

- Use Socket.IO Redis adapter for multiple backend instances. 

- Store raw ticks partitioned by date/symbol. 

- Add materialized minute aggregates for faster historical chart loads. 

- Add CDN/static hosting for frontend. 

- Add caching for symbols and market status. 

- Add observability: metrics, logs, traces. 

- 

## **30. Implementation Priority Order** 

Build in this order: 

1. Setup monorepo. 

36 

2. Add Docker Compose with PostgreSQL. 

3. Create backend project. 4. Configure env. 5. Setup DB schema and migrations. 6. Implement symbols seed. 7. Implement market status service. 

8. Implement raw tick insert service. 

9. Implement chart normalization service. 10. Implement history API. 11. Implement simulator. 12. Implement WebSocket broadcast. 13. Create frontend project. 14. Implement market status UI. 15. Implement dropdown. 16. Implement history fetch. 17. Implement chart rendering. 18. Implement live socket updates. 19. Implement point colors. 20. Implement dotted reference line. 21. Implement latest value badge. 22. Implement heartbeat latest point. 23. Implement tooltip. 24. Add tests. 25. Write README. 26. Write architecture doc. 27. Verify Docker Compose from scratch. 28. Record demo video. 

## **31. Final Deliverables Checklist** 

The final repository must include: 

- [ ] Full source code 

- [ ] Frontend React app 

- [ ] Backend Node app 

- [ ] PostgreSQL schema/migrations 

- [ ] Seed script 

- [ ] Live simulator • [ ] Dockerfiles 

- [ ] Docker Compose • [ ] `.env.example` 

- [ ] README 

- [ ] Architecture diagram 

- [ ] Architecture/design document 

- [ ] Testing instructions 

37 

- [ ] Demo script 

- [ ] Short demo video link placeholder in README 

- [ ] GitHub repository ready for submission 

## **32. Final Submission Quality Bar** 

Before considering the project complete, verify this flow works from a clean machine: 

```
gitclone<repo>
cd<repo>
cp.env.example.env
dockercomposeup--build
```

Then verify: 

- Frontend opens. 

- Backend health endpoint works. 

- Market status works. 

- Default chart is index. 

- Historical data appears. 

- Live updates appear within 3 seconds. 

- Latest point animates. 

- Latest value updates. 

- Tooltip works. 

- Dropdown switch works. 

- Stock chart works. 

- Closed-market state works. 

- README is clear. 

- Architecture document exists. 

- Docker setup does not require manual hidden steps. 

The project should be polished enough that the reviewer can run and understand it without asking any follow-up questions. 

38 

