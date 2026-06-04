import { Card, Empty } from 'antd'

const surfaceCardClass =
  '!border-[var(--border)] !bg-[var(--surface)] shadow-[var(--shadow)]'

export function EmptyChartState() {
  return (
    <Card
      className={`min-h-52.5 ${surfaceCardClass}`}
      classNames={{
        body: 'flex min-h-[210px] flex-col items-center justify-center gap-3 p-7 font-bold text-[var(--brand-text)]',
      }}
      variant="outlined"
    >
      <Empty
        description={
          <span className="font-bold text-(--brand-text)">
            No chart data is available yet.
          </span>
        }
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    </Card>
  )
}
