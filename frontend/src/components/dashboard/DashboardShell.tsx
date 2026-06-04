import type { ReactNode } from 'react'

import { DashboardHeader } from './DashboardHeader'
import { contentWidthClass } from './layout'
import type { HeaderState } from './types'

export function DashboardShell({
  state,
  children,
}: {
  state: HeaderState
  children: ReactNode
}) {
  return (
    <main className="min-h-screen w-full pb-6 max-[860px]:pb-4">
      <DashboardHeader state={state} />
      <div className={`${contentWidthClass} mt-6`}>{children}</div>
    </main>
  )
}
