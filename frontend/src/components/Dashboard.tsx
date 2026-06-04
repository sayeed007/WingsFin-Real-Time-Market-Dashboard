import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useChartHistory } from '../hooks/useChartHistory'
import { useMarketSocket } from '../hooks/useMarketSocket'
import { useMarketStatus, useSymbols } from '../hooks/useMarketStatus'
import type {
  ChartHistoryResponse,
  ChartPoint,
  MarketUpdatePayload,
  SymbolType,
} from '../types/market'
import { advanceToMinute, mergeLiveUpdate } from '../utils/mergeLiveUpdate'
import { minuteEpoch } from '../utils/time'
import { ChartTypeDropdown } from './ChartTypeDropdown'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import { MarketChart } from './MarketChart'
import { MarketClosedState } from './MarketClosedState'

const FALLBACK_SYMBOLS: Record<SymbolType, string> = {
  INDEX: 'DSEX',
  STOCK: 'GP',
}

export function Dashboard() {
  const [chartType, setChartType] = useState<SymbolType>('INDEX')
  const marketStatus = useMarketStatus()
  const symbolsQuery = useSymbols()

  const selectedSymbol = useMemo(() => {
    return (
      symbolsQuery.data?.symbols.find((symbol) => symbol.type === chartType)?.symbol ??
      FALLBACK_SYMBOLS[chartType]
    )
  }, [chartType, symbolsQuery.data?.symbols])

  const history = useChartHistory({
    type: chartType,
    symbol: selectedSymbol,
    enabled: Boolean(marketStatus.data?.isOpen && selectedSymbol),
  })

  const refetchMarketStatus = marketStatus.refetch
  const handleMarketClosed = useCallback(() => {
    void refetchMarketStatus()
  }, [refetchMarketStatus])

  if (marketStatus.isLoading) {
    return <LoadingState message="Loading market status..." />
  }

  if (marketStatus.isError || !marketStatus.data) {
    return (
      <ErrorState
        message="Could not load market status."
        onRetry={() => void marketStatus.refetch()}
      />
    )
  }

  return (
    <main className="dashboard">
      <header className="brand-hero">
        <div className="brand-lockup">
          <img
            className="brand-logo"
            src="/logo.webp"
            width="666"
            height="327"
            alt="WingsFin Securities Limited"
          />
          <div>
            <p className="eyebrow">WingsFin Market Desk</p>
            <h1>Real-Time Market Dashboard</h1>
            <p className="hero-copy">
              DSE index and stock movement with live session monitoring.
            </p>
          </div>
        </div>
        <div className={`status-card ${marketStatus.data.isOpen ? 'is-open' : ''}`}>
          <span>Market Status</span>
          <strong>{marketStatus.data.isOpen ? 'Open' : 'Closed'}</strong>
        </div>
      </header>

      {!marketStatus.data.isOpen ? (
        <MarketClosedState status={marketStatus.data} />
      ) : (
        <>
          <section className="toolbar">
            <ChartTypeDropdown value={chartType} onChange={setChartType} />
            <div className="session-strip" aria-label="Market session details">
              <div>
                <span>Session</span>
                <strong>
                  {marketStatus.data.marketOpenTime} - {marketStatus.data.marketCloseTime}
                </strong>
              </div>
              <div>
                <span>Timezone</span>
                <strong>{marketStatus.data.timezone}</strong>
              </div>
              <div>
                <span>Instrument</span>
                <strong>{selectedSymbol}</strong>
              </div>
            </div>
          </section>

          {history.isLoading ? (
            <LoadingState message="Loading chart data..." />
          ) : history.isError || !history.data ? (
            <ErrorState
              message="Could not load chart data."
              onRetry={() => void history.refetch()}
            />
          ) : history.data.points.length === 0 ? (
            <div className="state">No chart data is available yet.</div>
          ) : (
            <LiveChartSection
              key={`${history.data.type}:${history.data.symbol}:${history.data.currentMinute}`}
              history={history.data}
              onMarketClosed={handleMarketClosed}
            />
          )}
        </>
      )}
    </main>
  )
}

function LiveChartSection({
  history,
  onMarketClosed,
}: {
  history: ChartHistoryResponse
  onMarketClosed: () => void
}) {
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
