import type { SymbolType } from '../types/market'

export function ChartTypeDropdown({
  value,
  onChange,
}: {
  value: SymbolType
  onChange: (value: SymbolType) => void
}) {
  return (
    <label className="field">
      <span>Chart Type</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as SymbolType)}
      >
        <option value="INDEX">Index</option>
        <option value="STOCK">Stock</option>
      </select>
    </label>
  )
}
