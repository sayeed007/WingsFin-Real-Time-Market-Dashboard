import { DateTime } from 'luxon';

import type { ChartPoint } from '@src/modules/market/market.types';
import { compareToReference, roundMarketValue } from '@src/utils/compare';
import { toIso, toMinuteKey, toMinuteLabel } from '@src/utils/time';

export type RawTickForNormalization = {
  id: bigint | number;
  eventTime: Date;
  value: number;
};

export type NormalizeInput = {
  sessionStart: DateTime;
  currentMinute: DateTime;
  timezone: string;
  yesterdayClose: number;
  ticks: RawTickForNormalization[];
  fallbackValue: number;
};

export function normalizeTicksToMinutes(input: NormalizeInput): ChartPoint[] {
  const ticksByMinute = new Map<string, RawTickForNormalization>();

  for (const tick of input.ticks) {
    const key = toMinuteKey(DateTime.fromJSDate(tick.eventTime), input.timezone);
    const previous = ticksByMinute.get(key);
    if (!previous || tick.eventTime >= previous.eventTime) {
      ticksByMinute.set(key, tick);
    }
  }

  const points: ChartPoint[] = [];
  let cursor = input.sessionStart.startOf('minute');
  const end = input.currentMinute.startOf('minute');
  let currentValue = input.fallbackValue;

  while (cursor <= end) {
    const key = toMinuteKey(cursor, input.timezone);
    const tick = ticksByMinute.get(key);
    if (tick) {
      currentValue = tick.value;
    }

    const value = roundMarketValue(currentValue);
    points.push({
      time: toIso(cursor),
      minute: toMinuteLabel(cursor, input.timezone),
      value,
      status: compareToReference(value, input.yesterdayClose),
    });

    cursor = cursor.plus({ minutes: 1 });
  }

  return points;
}
