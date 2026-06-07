# Identified Improvements

## 1. Socket Reconnects on Symbol Switch

**Current behaviour:**
`useMarketSocket` creates a new `io()` connection inside a `useEffect` whose dependency array includes `type` and `symbol`. Every time the user switches the dropdown (Index ↔ Stock), React tears down the old effect (calling `socket.disconnect()`) and re-runs it, opening a brand-new WebSocket connection.

**Why it matters:**
A full TCP teardown + reconnect is unnecessary here. The backend's `replaceSubscription` already handles room-switching on an existing connection — it leaves the old Socket.IO room and joins the new one atomically. The client is paying reconnect cost for something the server already supports for free.

**Proposed fix:**
Separate socket *lifetime* from socket *subscription*:

- Create the socket once in a ref or a dedicated effect with an empty dependency array (`[]`), so the connection lives for the full component lifetime.
- In a second, separate effect that depends on `[type, symbol]`, emit `subscribe` with the new values on the already-open socket — no disconnect/reconnect needed.

```ts
// one-time connection
const socketRef = useRef(io(SOCKET_URL, { transports: ['websocket', 'polling'] }))

// re-subscribe when symbol changes — no reconnect
useEffect(() => {
  socketRef.current.emit('subscribe', { type, symbol })
}, [type, symbol])
```

---

## 2. Market Status Polling — Partial Redundancy

**Current behaviour:**
`useMarketStatus` sets `refetchInterval: 30_000`, which fires `GET /api/market/status` every 30 seconds while the page is open. It covers two transitions:

| Transition | Covered by socket? | Covered by poll? |
|---|---|---|
| Open → Closed | Yes — `market:closed` event | Yes |
| Closed → Open | **No** | **Yes — only mechanism** |

**The closed → open gap:**
`market.clock.ts` only emits a socket event on the open → closed transition. The closed → open transition logs an audit entry but sends nothing to clients. Additionally, `useMarketSocket` has `enabled: history.isMarketOpen`, so the socket is not even connected when the market is closed. A user who arrives before market open and stays on the page relies entirely on the 30-second poll to detect when trading begins and the chart should load.

**The open → closed overlap:**
For a user already on the page with an active market, the poll is redundant — the `market:closed` socket event fires with 1-second precision and `useMarketSocket` already calls `onClosed()`. The poll only adds marginal value here as a fallback if the socket drops at the exact close moment.

**Proposed complete fix:**
The `refetchInterval` can only be safely removed if two additions are made:

1. **Backend** — emit `market:opened` in `market.clock.ts` on the `!lastOpen && open` branch, mirroring `emitMarketClosed`:

```ts
// market.clock.ts
if (!lastOpen && open) {
  emitMarketOpened({ openedAt: toIso(session.sessionStart) })
  // ...
}
```

2. **Frontend** — maintain a lightweight always-on socket (not gated by `isMarketOpen`) that listens only for `market:opened` and invalidates the status query:

```ts
socket.on('market:opened', () => {
  queryClient.invalidateQueries({ queryKey: ['market-status'] })
})
```

With both in place the poll becomes truly redundant and can be dropped. Until then, the `refetchInterval` is load-bearing for the pre-open user scenario and must stay.
