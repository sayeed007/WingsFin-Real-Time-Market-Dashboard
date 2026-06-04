import { Alert, Button, Card } from 'antd'

export function ErrorState({
  label = 'Data Issue',
  title = 'Could not load data.',
  message,
  onRetry,
}: {
  label?: string
  title?: string
  message: string
  onRetry: () => void
}) {
  return (
    <Card
      className="min-h-52.5 border-(--border)! bg-(--surface)! shadow-(--shadow)"
      classNames={{
        body: 'flex min-h-[210px] flex-col items-start justify-center gap-3 p-7 font-bold text-[var(--brand-text)]',
      }}
      role="alert"
      variant="outlined"
    >
      <span className="text-xs font-extrabold uppercase tracking-[0.04em] text-(--danger)">
        {label}
      </span>
      <Alert
        action={
          <Button danger type="primary" onClick={onRetry}>
            Retry
          </Button>
        }
        className="w-full border-(--error-border)! bg-[linear-gradient(135deg,var(--error-accent),var(--transparent)_48%),var(--surface)]!"
        classNames={{
          title:
            '![font-family:var(--serif)] !text-[24px] !font-medium !leading-[1.2] !text-[var(--brand-ink)]',
          description: 'max-w-[620px] !font-semibold !text-[var(--brand-text)]',
        }}
        description={message}
        showIcon
        title={title}
        type="error"
        variant="outlined"
      />
    </Card>
  )
}
