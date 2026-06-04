import { Card, Spin } from 'antd'

export function LoadingState({ message }: { message: string }) {
  return (
    <Card
      aria-live="polite"
      className="min-h-[210px] !border-[var(--border)] !bg-[var(--surface)] shadow-[var(--shadow)]"
      classNames={{
        body: 'flex min-h-[210px] flex-col items-center justify-center gap-3 p-7 font-bold text-[var(--brand-text)]',
      }}
      role="status"
      variant="outlined"
    >
      <Spin
        className="[&_.ant-spin-text]:!font-bold [&_.ant-spin-text]:!text-[var(--brand-text)]"
        description={message}
        size="large"
      />
    </Card>
  )
}
