import type { PointStatus } from '../types/market'
import { pointColors } from '../theme/designTokens'

export const POINT_COLORS: Record<PointStatus, string> = pointColors

export function statusForValue(value: number, reference: number): PointStatus {
  if (Math.abs(value - reference) < 0.0001) {
    return 'equal'
  }
  return value > reference ? 'above' : 'below'
}
