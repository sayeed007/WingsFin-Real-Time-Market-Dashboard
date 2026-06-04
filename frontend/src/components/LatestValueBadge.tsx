import { Card, Statistic, Tag } from 'antd'

import type { SymbolType } from '../types/market'

export function LatestValueBadge({
  value,
  type,
}: {
  value: number
  type: SymbolType
}) {
  return (
    <Card
      className="min-w-[150px] !border-[var(--success-border)] !bg-[linear-gradient(180deg,var(--surface),var(--surface-green))] max-[860px]:w-full"
      classNames={{
        body: 'grid justify-items-end px-3.5 py-3 text-right max-[860px]:justify-items-start max-[860px]:text-left',
      }}
      variant="outlined"
    >
      <Statistic
        classNames={{
          title:
            'text-xs font-extrabold uppercase tracking-[0.04em] !text-[var(--brand-text)]',
          content:
            '!mt-0.5 ![font-family:var(--serif)] !text-[28px] !font-medium !leading-[1.05] !text-[var(--brand-ink)]',
        }}
        precision={2}
        title={type === 'STOCK' ? 'Latest Price' : 'Latest'}
        value={value}
      />
      <Tag
        className="mt-1.5 !me-0 justify-self-end rounded-full text-[11px] font-extrabold leading-[1.45] max-[860px]:justify-self-start"
        color="success"
        variant="solid"
      >
        Live
      </Tag>
    </Card>
  )
}
