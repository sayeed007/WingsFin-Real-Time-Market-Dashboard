import { useCallback, useMemo, useState } from 'react'

import { useChartHistory } from '../hooks/useChartHistory'
import { useMarketStatus, useSymbols } from '../hooks/useMarketStatus'
import type { SymbolType } from '../types/market'
import { ChartTypeDropdown } from './ChartTypeDropdown'
import { DashboardShell } from './dashboard/DashboardShell'
import { EmptyChartState } from './dashboard/EmptyChartState'
import { LiveChartSection } from './dashboard/LiveChartSection'
import { MarketSessionCard } from './dashboard/MarketSessionCard'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
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
            <MarketSessionCard
              marketOpenTime={marketStatus.data.marketOpenTime}
              marketCloseTime={marketStatus.data.marketCloseTime}
              timezone={marketStatus.data.timezone}
              selectedSymbol={selectedSymbol}
            />
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
            <EmptyChartState />
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
