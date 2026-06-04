import type { SymbolType } from '../types/market'

export function LatestValueBadge({
  value,
  type,
}: {
  value: number
  type: SymbolType
}) {
  return (
    <div className="latest-badge">
      <span>{type === 'STOCK' ? 'Latest Price' : 'Latest'}</span>
      <strong>{value.toFixed(2)}</strong>
      <small>Live</small>
    </div>
  )
}
