import { Select } from 'antd'

import type { SymbolType } from '../types/market'

const chartTypeOptions: Array<{ label: string; value: SymbolType }> = [
  { label: 'Index', value: 'INDEX' },
  { label: 'Stock', value: 'STOCK' },
]

export function ChartTypeDropdown({
  value,
  onChange,
}: {
  value: SymbolType
  onChange: (value: SymbolType) => void
}) {
  return (
    <div className="grid min-w-[220px] gap-1.5 text-[13px] font-extrabold text-[var(--brand-text)] max-[860px]:w-full">
      <span id="chart-type-label">Chart Type</span>
      <Select<SymbolType>
        aria-labelledby="chart-type-label"
        className="chart-type-select h-[42px] min-w-[220px] max-[860px]:w-full"
        options={chartTypeOptions}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}
