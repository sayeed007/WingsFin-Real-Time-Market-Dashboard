import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, Empty } from 'antd'

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

type HeaderState = 'checking' | 'open' | 'closed' | 'offline'

const contentWidthClass =
  'mx-auto w-[min(1280px,calc(100%_-_40px))] max-[860px]:w-[min(100%_-_24px,1280px)]'

const sessionLabelClass =
  'text-xs font-extrabold uppercase tracking-[0.04em] text-[var(--brand-text)]'

const sessionItemClass = 'grid gap-0.5 px-[18px] py-3'
const borderedSessionItemClass = `${sessionItemClass} border-l border-[var(--border)] max-[860px]:border-l-0 max-[860px]:border-t`
const sessionValueClass = 'text-[15px] leading-[1.35] text-[var(--brand-ink)]'
const surfaceCardClass =
  '!border-[var(--border)] !bg-[var(--surface)] shadow-[var(--shadow)]'

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
    return (
      <DashboardShell state="checking">
        <LoadingState message="Checking market data service..." />
      </DashboardShell>
    )
  }

  if (marketStatus.isError || !marketStatus.data) {
    return (
      <DashboardShell state="offline">
        <ErrorState
          label="Service Offline"
          title="Market data service is unavailable."
          message="The dashboard is ready, but live market data is not responding right now. Start the backend service, then retry the request."
          onRetry={() => void marketStatus.refetch()}
        />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell state={marketStatus.data.isOpen ? 'open' : 'closed'}>
      {!marketStatus.data.isOpen ? (
        <MarketClosedState status={marketStatus.data} />
      ) : (
        <>
          <section className="mb-3 mt-2.5 flex items-stretch justify-between gap-3 max-[860px]:grid">
            <ChartTypeDropdown value={chartType} onChange={setChartType} />
            <Card
              aria-label="Market session details"
              className="flex-1 overflow-hidden !border-[var(--border)] !bg-[var(--session-bg)] shadow-[var(--session-shadow)]"
              classNames={{ body: 'grid grid-cols-3 p-0 max-[860px]:grid-cols-1' }}
              variant="outlined"
            >
              <div className={sessionItemClass}>
                <span className={sessionLabelClass}>Session</span>
                <strong className={sessionValueClass}>
                  {marketStatus.data.marketOpenTime} - {marketStatus.data.marketCloseTime}
                </strong>
              </div>
              <div className={borderedSessionItemClass}>
                <span className={sessionLabelClass}>Timezone</span>
                <strong className={sessionValueClass}>{marketStatus.data.timezone}</strong>
              </div>
              <div className={borderedSessionItemClass}>
                <span className={sessionLabelClass}>Instrument</span>
                <strong className={sessionValueClass}>{selectedSymbol}</strong>
              </div>
            </Card>
          </section>

          {history.isLoading ? (
            <LoadingState message="Loading chart data..." />
          ) : history.isError || !history.data ? (
            <ErrorState
              label="Chart Data"
              title="Could not load chart data."
              message="The market session is available, but this chart request failed. Retry the request to reload the selected instrument."
              onRetry={() => void history.refetch()}
            />
          ) : history.data.points.length === 0 ? (
            <Card
              className={`min-h-[210px] ${surfaceCardClass}`}
              classNames={{
                body: 'flex min-h-[210px] flex-col items-center justify-center gap-3 p-7 font-bold text-[var(--brand-text)]',
              }}
              variant="outlined"
            >
              <Empty
                description={
                  <span className="font-bold text-[var(--brand-text)]">
                    No chart data is available yet.
                  </span>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          ) : (
            <LiveChartSection
              key={`${history.data.type}:${history.data.symbol}:${history.data.currentMinute}`}
              history={history.data}
              onMarketClosed={handleMarketClosed}
            />
          )}
        </>
      )}
    </DashboardShell>
  )
}

function DashboardShell({
  state,
  children,
}: {
  state: HeaderState
  children: ReactNode
}) {
  return (
    <main className="min-h-screen w-full pb-6 max-[860px]:pb-4">
      <DashboardHeader state={state} />
      <div className={`${contentWidthClass} pt-0`}>{children}</div>
    </main>
  )
}

function DashboardHeader({ state }: { state: HeaderState }) {
  return (
    <header className="brand-hero border-b border-[var(--hero-border)] py-5 text-[var(--hero-foreground)] max-[860px]:py-4">
      <div
        className={`${contentWidthClass} flex items-stretch justify-between gap-5 max-[860px]:grid`}
      >
        <div className="flex min-w-0 items-center gap-[18px] max-[540px]:grid max-[540px]:items-start">
          <img
            className="block h-auto w-[clamp(126px,14vw,184px)] flex-[0_0_clamp(126px,14vw,184px)] rounded-md bg-[var(--hero-logo-bg)] object-contain shadow-[var(--hero-logo-shadow)] max-[540px]:w-[150px]"
            src="/logo.webp"
            width="666"
            height="327"
            alt="WingsFin Securities Limited"
          />
          <div>
            <p className="m-0 mb-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--hero-text-muted)]">
              WingsFin Market Desk
            </p>
            <h1 className="m-0 [font-family:var(--serif)] text-[36px] font-medium leading-[1.1] tracking-normal text-[var(--hero-foreground)] max-[860px]:text-[30px] max-[540px]:text-[26px]">
              Real-Time Market Dashboard
            </h1>
            <p className="m-0 mt-2 max-w-[620px] text-[14px] text-[var(--hero-text-muted)]">
              DSE index and stock movement with live session monitoring.
            </p>
          </div>
        </div>
        <Card
          className="grid min-w-[170px] !border-[var(--status-border)] !bg-[var(--status-bg)] !text-[var(--hero-foreground)] shadow-none max-[860px]:min-w-0"
          classNames={{
            body: 'grid h-full content-center px-4 py-3 text-right max-[860px]:text-left',
          }}
          variant="outlined"
        >
          <span className="text-xs font-extrabold uppercase tracking-[0.04em] text-[var(--status-label)]">
            Market Status
          </span>
          <strong
            className={`[font-family:var(--serif)] text-[26px] font-medium leading-[1.1] ${getStatusValueClass(state)}`}
          >
            {getStatusLabel(state)}
          </strong>
        </Card>
      </div>
    </header>
  )
}

function getStatusLabel(state: HeaderState) {
  switch (state) {
    case 'checking':
      return 'Checking'
    case 'open':
      return 'Open'
    case 'closed':
      return 'Closed'
    case 'offline':
      return 'Offline'
  }
}

function getStatusValueClass(state: HeaderState) {
  switch (state) {
    case 'checking':
      return 'text-[var(--hero-foreground)]'
    case 'open':
      return 'text-[var(--brand-green)]'
    case 'closed':
      return 'text-[var(--danger)]'
    case 'offline':
      return 'text-[var(--status-offline)]'
  }
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
