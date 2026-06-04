import { Card, Typography } from 'antd'

import type { MarketStatusResponse } from '../types/market'

export function MarketClosedState({ status }: { status: MarketStatusResponse }) {
  return (
    <Card
      aria-live="polite"
      className="border-(--border)! bg-[linear-gradient(135deg,var(--closed-accent),var(--transparent)_52%),var(--surface)]! shadow-(--shadow) mt-4!"
      classNames={{ body: 'p-6' }}
      variant="outlined"
    >
      <Typography.Text className="text-xs font-extrabold uppercase tracking-[0.04em] text-(--brand-text)">
        Market Status
      </Typography.Text>
      <Typography.Title
        className="m-0! mt-2! [font-family:var(--serif)]! text-[24px]! font-medium! leading-[1.14]! text-(--brand-ink)! max-[860px]:text-[22px]!"
        level={2}
      >
        Market is currently closed.
      </Typography.Title>
      <Typography.Paragraph className="m-0! mt-2! text-(--brand-text)!">
        Market hours: {status.marketOpenTime} - {status.marketCloseTime}{' '}
        {status.timezone}
      </Typography.Paragraph>
    </Card>
  )
}
