import { Card } from 'antd'

const sessionLabelClass =
  'text-xs font-extrabold uppercase tracking-[0.04em] text-[var(--brand-text)]'

const sessionItemClass = 'grid gap-0.5 px-[18px] py-3'
const borderedSessionItemClass = `${sessionItemClass} border-l border-[var(--border)] max-[860px]:border-l-0 max-[860px]:border-t`
const sessionValueClass = 'text-[15px] leading-[1.35] text-[var(--brand-ink)]'

type MarketSessionCardProps = {
  marketOpenTime: string
  marketCloseTime: string
  timezone: string
  selectedSymbol: string
}

export function MarketSessionCard({
  marketOpenTime,
  marketCloseTime,
  timezone,
  selectedSymbol,
}: MarketSessionCardProps) {
  return (
    <Card
      aria-label="Market session details"
      className="flex-1 overflow-hidden border-(--border)! bg-(--session-bg)! shadow-(--session-shadow)"
      classNames={{ body: 'grid grid-cols-3 p-1! max-[860px]:grid-cols-1' }}
      variant="outlined"
    >
      <div className={sessionItemClass}>
        <span className={sessionLabelClass}>Session</span>
        <strong className={sessionValueClass}>
          {marketOpenTime} - {marketCloseTime}
        </strong>
      </div>
      <div className={borderedSessionItemClass}>
        <span className={sessionLabelClass}>Timezone</span>
        <strong className={sessionValueClass}>{timezone}</strong>
      </div>
      <div className={borderedSessionItemClass}>
        <span className={sessionLabelClass}>Instrument</span>
        <strong className={sessionValueClass}>{selectedSymbol}</strong>
      </div>
    </Card>
  )
}
