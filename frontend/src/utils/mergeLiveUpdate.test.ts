import { describe, expect, it } from 'vitest'

import type { ChartPoint, MarketUpdatePayload } from '../types/market'
import { advanceToMinute, mergeLiveUpdate } from './mergeLiveUpdate'

const basePoints: ChartPoint[] = [
  {
    time: '2026-06-03T04:00:00.000Z',
    minute: '10:00',
    value: 100,
    status: 'equal',
  },
]

describe('mergeLiveUpdate', () => {
  it('replaces same-minute updates', () => {
    const update: MarketUpdatePayload = {
      symbol: 'DSEX',
      type: 'INDEX',
      time: '2026-06-03T10:00:40+06:00',
      minuteTime: '2026-06-03T10:00:00+06:00',
      value: 101,
      yesterdayClose: 100,
      status: 'above',
    }

    const points = mergeLiveUpdate(
      basePoints,
      update,
      '2026-06-03T10:00:00+06:00',
      '2026-06-03T14:30:00+06:00',
    )

    expect(points).toHaveLength(1)
    expect(points[0].value).toBe(101)
    expect(points[0].status).toBe('above')
  })

  it('fills missing minutes before appending a later update', () => {
    const update: MarketUpdatePayload = {
      symbol: 'DSEX',
      type: 'INDEX',
      time: '2026-06-03T10:03:20+06:00',
      minuteTime: '2026-06-03T10:03:00+06:00',
      value: 98,
      yesterdayClose: 100,
      status: 'below',
    }

    const points = mergeLiveUpdate(
      basePoints,
      update,
      '2026-06-03T10:00:00+06:00',
      '2026-06-03T14:30:00+06:00',
    )

    expect(points.map((point) => point.value)).toEqual([100, 100, 100, 98])
  })

  it('ignores updates before session start', () => {
    const update: MarketUpdatePayload = {
      symbol: 'DSEX',
      type: 'INDEX',
      time: '2026-06-03T09:59:00+06:00',
      minuteTime: '2026-06-03T09:59:00+06:00',
      value: 999,
      yesterdayClose: 100,
      status: 'above',
    }

    const points = mergeLiveUpdate(
      basePoints,
      update,
      '2026-06-03T10:00:00+06:00',
      '2026-06-03T14:30:00+06:00',
    )

    expect(points).toBe(basePoints)
  })

  it('ignores updates at or after session end', () => {
    const update: MarketUpdatePayload = {
      symbol: 'DSEX',
      type: 'INDEX',
      time: '2026-06-03T14:30:00+06:00',
      minuteTime: '2026-06-03T14:30:00+06:00',
      value: 999,
      yesterdayClose: 100,
      status: 'above',
    }

    const points = mergeLiveUpdate(
      basePoints,
      update,
      '2026-06-03T10:00:00+06:00',
      '2026-06-03T14:30:00+06:00',
    )

    expect(points).toBe(basePoints)
  })

  it('handles update on an empty points array', () => {
    const update: MarketUpdatePayload = {
      symbol: 'DSEX',
      type: 'INDEX',
      time: '2026-06-03T10:00:20+06:00',
      minuteTime: '2026-06-03T10:00:00+06:00',
      value: 105,
      yesterdayClose: 100,
      status: 'above',
    }

    const points = mergeLiveUpdate(
      [],
      update,
      '2026-06-03T10:00:00+06:00',
      '2026-06-03T14:30:00+06:00',
    )

    expect(points).toHaveLength(1)
    expect(points[0].value).toBe(105)
  })

  it('carries forward existing value for gap-filled minutes', () => {
    const update: MarketUpdatePayload = {
      symbol: 'DSEX',
      type: 'INDEX',
      time: '2026-06-03T10:02:15+06:00',
      minuteTime: '2026-06-03T10:02:00+06:00',
      value: 110,
      yesterdayClose: 100,
      status: 'above',
    }

    const points = mergeLiveUpdate(
      basePoints,
      update,
      '2026-06-03T10:00:00+06:00',
      '2026-06-03T14:30:00+06:00',
    )

    expect(points[1].value).toBe(100)
    expect(points[2].value).toBe(110)
  })

  it('inserts out-of-order updates chronologically', () => {
    const existingPoints: ChartPoint[] = [
      basePoints[0],
      {
        time: '2026-06-03T04:03:00.000Z',
        minute: '10:03',
        value: 104,
        status: 'above',
      },
    ]
    const update: MarketUpdatePayload = {
      symbol: 'DSEX',
      type: 'INDEX',
      time: '2026-06-03T10:02:15+06:00',
      minuteTime: '2026-06-03T10:02:00+06:00',
      value: 102,
      yesterdayClose: 100,
      status: 'above',
    }

    const points = mergeLiveUpdate(
      existingPoints,
      update,
      '2026-06-03T10:00:00+06:00',
      '2026-06-03T14:30:00+06:00',
    )

    expect(points.map((point) => point.time)).toEqual([
      '2026-06-03T04:00:00.000Z',
      '2026-06-03T04:02:00.000Z',
      '2026-06-03T04:03:00.000Z',
    ])
  })
})

describe('advanceToMinute', () => {
  it('advances to the current minute without new ticks', () => {
    const points = advanceToMinute(
      basePoints,
      '2026-06-03T04:02:10.000Z',
      '2026-06-03T14:30:00+06:00',
      100,
    )

    expect(points.map((point) => point.value)).toEqual([100, 100, 100])
  })

  it('returns same reference if already at target minute', () => {
    const points = advanceToMinute(
      basePoints,
      '2026-06-03T04:00:30.000Z',
      '2026-06-03T14:30:00+06:00',
      100,
    )

    expect(points).toBe(basePoints)
  })

  it('does not advance past session end', () => {
    const sessionEnd = '2026-06-03T04:02:00.000Z'
    const points = advanceToMinute(
      basePoints,
      '2026-06-03T04:05:00.000Z',
      sessionEnd,
      100,
    )

    expect(points).toHaveLength(2)
    expect(points[1].minute).toBeDefined()
  })

  it('returns same reference for empty points', () => {
    const result = advanceToMinute(
      [],
      '2026-06-03T04:02:10.000Z',
      '2026-06-03T14:30:00+06:00',
      100,
    )

    expect(result).toHaveLength(0)
  })
})
