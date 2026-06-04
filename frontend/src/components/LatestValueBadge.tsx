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
      className="min-w-37.5 border-(--success-border)! bg-[linear-gradient(180deg,var(--surface),var(--surface-green))]! max-[860px]:w-full"
      classNames={{
        body: 'grid justify-items-end p-3! text-center max-[860px]:justify-items-start max-[860px]:text-left',
      }}
      variant="outlined"
    >
      <Statistic
        className="w-full"
        classNames={{
          title:
            'text-xs font-extrabold uppercase tracking-[0.04em] !text-[var(--brand-text)]',
          content:
            '!mt-0.5 ![font-family:var(--serif)] !text-[28px] !font-medium !leading-[1.05] !text-[var(--brand-ink)]',
        }}
        precision={2}
        title={
          <span className="inline-flex w-full items-center justify-center gap-1.5 max-[860px]:justify-start">
            <span>{type === 'STOCK' ? 'Latest Price' : 'Latest'}</span>
            <Tag
              className="m-0! rounded-full text-[11px] font-extrabold leading-[1.45] normal-case tracking-normal"
              color="success"
              variant="solid"
            >
              Live
            </Tag>
          </span>
        }
        value={value}
      />
    </Card>
  )
}
