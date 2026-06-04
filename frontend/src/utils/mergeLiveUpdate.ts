import type { ChartPoint, MarketUpdatePayload } from '../types/market'
import { statusForValue } from './chartColors'
import { formatMinute, minuteEpoch, MINUTE_MS } from './time'

function createPoint(epoch: number, value: number, reference: number): ChartPoint {
  return {
    time: new Date(epoch).toISOString(),
    minute: formatMinute(epoch),
    value,
    status: statusForValue(value, reference),
  }
}

export function mergeLiveUpdate(
  points: ChartPoint[],
  update: MarketUpdatePayload,
  sessionStart: string,
  sessionEnd: string,
): ChartPoint[] {
  const updateEpoch = minuteEpoch(update.minuteTime)
  const startEpoch = minuteEpoch(sessionStart)
  const endEpoch = minuteEpoch(sessionEnd)

  if (updateEpoch < startEpoch || updateEpoch >= endEpoch) {
    return points
  }

  const existingIndex = points.findIndex(
    (point) => minuteEpoch(point.time) === updateEpoch,
  )
  const updatePoint = createPoint(updateEpoch, update.value, update.yesterdayClose)

  if (existingIndex >= 0) {
    const next = [...points]
    next[existingIndex] = updatePoint
    return next
  }

  const lastPoint = points[points.length - 1]
  if (!lastPoint) {
    return [updatePoint]
  }

  const next = [...points]
  let cursor = minuteEpoch(lastPoint.time) + MINUTE_MS
  const previousValue = lastPoint.value

  while (cursor < updateEpoch) {
    next.push(createPoint(cursor, previousValue, update.yesterdayClose))
    cursor += MINUTE_MS
  }

  next.push(createPoint(updateEpoch, update.value, update.yesterdayClose))
  return next
}

export function advanceToMinute(
  points: ChartPoint[],
  targetTime: string,
  sessionEnd: string,
  reference: number,
): ChartPoint[] {
  const lastPoint = points[points.length - 1]
  if (!lastPoint) {
    return points
  }

  const endEpoch = minuteEpoch(sessionEnd)
  const targetEpoch = Math.min(minuteEpoch(targetTime), endEpoch - MINUTE_MS)
  const cursor = minuteEpoch(lastPoint.time) + MINUTE_MS

  if (cursor > targetEpoch) {
    return points
  }

  const next = [...points]
  let c = cursor
  while (c <= targetEpoch) {
    next.push(createPoint(c, lastPoint.value, reference))
    c += MINUTE_MS
  }

  return next
}
