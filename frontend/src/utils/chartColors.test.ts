import { describe, expect, it } from 'vitest'

import { POINT_COLORS, statusForValue } from './chartColors'

describe('statusForValue', () => {
  it('returns "above" when value > reference', () => {
    expect(statusForValue(101, 100)).toBe('above')
  })

  it('returns "below" when value < reference', () => {
    expect(statusForValue(99, 100)).toBe('below')
  })

  it('returns "equal" when value matches reference within tolerance', () => {
    expect(statusForValue(100, 100)).toBe('equal')
    expect(statusForValue(100.00005, 100)).toBe('equal')
  })

  it('returns "above" for tiny positive difference outside tolerance', () => {
    expect(statusForValue(100.001, 100)).toBe('above')
  })

  it('returns "below" for tiny negative difference outside tolerance', () => {
    expect(statusForValue(99.999, 100)).toBe('below')
  })
})

describe('POINT_COLORS', () => {
  it('has the correct hex values from the spec', () => {
    expect(POINT_COLORS.above).toBe('#7327F5')
    expect(POINT_COLORS.below).toBe('#F52738')
    expect(POINT_COLORS.equal).toBe('#EE27F5')
  })
})
