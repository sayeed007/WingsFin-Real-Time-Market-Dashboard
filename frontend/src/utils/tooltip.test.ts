import { describe, expect, it } from 'vitest'

import { formatChartTooltip } from './tooltip'

describe('formatChartTooltip', () => {
  it('formats chart values and reference change', () => {
    const html = formatChartTooltip(
      [
        {
          data: {
            value: ['2026-06-03T10:37:00+06:00', 5222.22],
          },
        },
      ],
      5200,
      'DSEX',
    )

    expect(html).toContain('DSEX')
    expect(html).toContain('Value: 5222.22')
    expect(html).toContain('Reference: 5200.00')
    expect(html).toContain('Change: +22.22')
  })
})
