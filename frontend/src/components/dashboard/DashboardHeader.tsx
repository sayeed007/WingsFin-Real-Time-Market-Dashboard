import { Card } from 'antd'

import { contentWidthClass } from './layout'
import type { HeaderState } from './types'

export function DashboardHeader({ state }: { state: HeaderState }) {
  return (
    <header className="brand-hero border-b border-(--hero-border) px-5 py-5 text-(--hero-foreground) max-[540px]:px-3 max-[540px]:py-4">
      <div
        className={`${contentWidthClass} flex items-center justify-between gap-5 max-[860px]:grid`}
      >
        <div className="flex min-w-0 items-center gap-4.5 max-[540px]:grid max-[540px]:items-start">
          <img
            className="block h-auto w-[clamp(126px,14vw,184px)] flex-[0_0_clamp(126px,14vw,184px)] rounded-md bg-(--hero-logo-bg) object-contain shadow-(--hero-logo-shadow) max-[540px]:w-37.5"
            src="/logo.webp"
            width="666"
            height="327"
            alt="WingsFin Securities Limited"
          />
          <div className="brand-hero-copy grid gap-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-(--hero-text-muted)">
              WingsFin Market Desk
            </p>
            <h1 className="[font-family:var(--serif)] text-[36px] font-medium leading-[1.1] tracking-normal text-(--hero-foreground) max-[860px]:text-[30px] max-[540px]:text-[26px]">
              Real-Time Market Dashboard
            </h1>
            <p className="max-w-155 text-[14px] text-(--hero-text-muted)">
              DSE index and stock movement with live session monitoring.
            </p>
          </div>
        </div>
        <Card
          className="grid w-[clamp(126px,14vw,184px)] shrink-0 self-center border-(--status-border)! bg-(--status-bg)! text-(--hero-foreground)! shadow-none max-[860px]:w-full max-[540px]:w-37.5"
          classNames={{
            body: 'grid min-h-[clamp(82px,7vw,100px)] content-center px-[16px] py-[12px] text-center max-[860px]:text-left',
          }}
          variant="outlined"
        >
          <span className="text-xs font-extrabold uppercase tracking-[0.04em] text-(--status-label)">
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
