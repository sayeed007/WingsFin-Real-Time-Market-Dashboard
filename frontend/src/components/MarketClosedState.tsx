import type { MarketStatusResponse } from '../types/market'

export function MarketClosedState({ status }: { status: MarketStatusResponse }) {
  return (
    <section className="closed-state" aria-live="polite">
      <span className="closed-state__label">Market Status</span>
      <h2>Market is currently closed.</h2>
      <p>
        Market hours: {status.marketOpenTime} - {status.marketCloseTime}{' '}
        {status.timezone}
      </p>
    </section>
  )
}
