import type { PointStatus } from '../types/market'

export const POINT_COLORS: Record<PointStatus, string> = {
  above: '#7327F5',
  below: '#F52738',
  equal: '#EE27F5',
}

export function statusForValue(value: number, reference: number): PointStatus {
  if (Math.abs(value - reference) < 0.0001) {
    return 'equal'
  }
  return value > reference ? 'above' : 'below'
}
