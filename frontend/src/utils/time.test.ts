import { describe, expect, it } from 'vitest'

import { minuteEpoch, formatMinute, MINUTE_MS } from './time'

describe('minuteEpoch', () => {
  it('floors to the minute boundary', () => {
    const iso = '2026-06-03T10:05:37.123Z'
    const expected = new Date('2026-06-03T10:05:00.000Z').getTime()
    expect(minuteEpoch(iso)).toBe(expected)
  })

  it('returns same value when already at minute boundary', () => {
    const iso = '2026-06-03T10:05:00.000Z'
    const epoch = minuteEpoch(iso)
    expect(epoch % MINUTE_MS).toBe(0)
    expect(epoch).toBe(new Date(iso).getTime())
  })

  it('handles Date objects', () => {
    const date = new Date('2026-06-03T10:05:30.000Z')
    expect(minuteEpoch(date)).toBe(new Date('2026-06-03T10:05:00.000Z').getTime())
  })

  it('handles numeric timestamps', () => {
    const ms = new Date('2026-06-03T10:05:30.000Z').getTime()
    expect(minuteEpoch(ms)).toBe(new Date('2026-06-03T10:05:00.000Z').getTime())
  })
})

describe('formatMinute', () => {
  it('formats epoch to HH:mm', () => {
    const epoch = new Date('2026-06-03T04:05:00.000Z').getTime()
    const result = formatMinute(epoch)
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })
})

describe('MINUTE_MS', () => {
  it('equals 60000', () => {
    expect(MINUTE_MS).toBe(60_000)
  })
})
