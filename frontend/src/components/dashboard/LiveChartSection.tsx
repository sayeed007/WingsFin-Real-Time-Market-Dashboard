import { useCallback, useEffect, useRef, useState } from 'react'

import { useMarketSocket } from '../../hooks/useMarketSocket'
import type {
  ChartHistoryResponse,
  ChartPoint,
  MarketUpdatePayload,
} from '../../types/market'
import { advanceToMinute, mergeLiveUpdate } from '../../utils/mergeLiveUpdate'
import { minuteEpoch } from '../../utils/time'
import { MarketChart } from '../MarketChart'

export function LiveChartSection({
  history,
  onMarketClosed,
  onReconnect,
}: {
  history: ChartHistoryResponse
  onMarketClosed: () => void
  onReconnect?: () => void
}) {
  // `points` is seeded from the authoritative server history at mount. The
  // parent remounts this section (via a key that includes the query's
  // dataUpdatedAt) whenever a fresh history payload arrives — e.g. on a
  // socket-reconnect refetch — so any gap missed while disconnected is healed
  // from server data without a setState-in-effect re-sync. During normal
  // operation the key is stable, so live-merged points accumulate intact.
  const [points, setPoints] = useState<ChartPoint[]>(() => history.points)
  const lastMinuteRef = useRef<number>(
    history.points.length > 0
      ? minuteEpoch(history.points[history.points.length - 1].time)
      : 0,
  )

  const handleUpdate = useCallback(
    (payload: MarketUpdatePayload) => {
      setPoints((previous) =>
        mergeLiveUpdate(
          previous,
          payload,
          history.sessionStart,
          history.sessionEnd,
          history.timezone,
        ),
      )
    },
    [history.sessionEnd, history.sessionStart, history.timezone],
  )

  useMarketSocket({
    enabled: history.isMarketOpen,
    type: history.type,
    symbol: history.symbol,
    onUpdate: handleUpdate,
    onClosed: onMarketClosed,
    onReconnect,
  })

  useEffect(() => {
    const interval = window.setInterval(() => {
      const nowMinute = minuteEpoch(new Date().toISOString())
      if (nowMinute <= lastMinuteRef.current) {
        return
      }
      lastMinuteRef.current = nowMinute
      setPoints((previous) =>
        advanceToMinute(
          previous,
          new Date().toISOString(),
          history.sessionEnd,
          history.yesterdayClose,
          history.timezone,
        ),
      )
    }, 1_000)

    return () => window.clearInterval(interval)
  }, [history.sessionEnd, history.timezone, history.yesterdayClose])

  return (
    <MarketChart
      symbol={history.symbol}
      type={history.type}
      points={points}
      sessionStart={history.sessionStart}
      sessionEnd={history.sessionEnd}
      yesterdayClose={history.yesterdayClose}
      timezone={history.timezone}
    />
  )
}
