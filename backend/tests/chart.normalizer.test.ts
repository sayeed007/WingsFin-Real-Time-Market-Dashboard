import { DateTime } from 'luxon';

import { normalizeTicksToMinutes } from '@src/modules/chart/chart.normalizer';

describe('chart normalizer', () => {
  const sessionStart = DateTime.fromISO('2026-06-03T10:00:00', {
    zone: 'Asia/Dhaka',
  });

  it('forward-fills missing minutes and uses the latest tick in a minute', () => {
    const points = normalizeTicksToMinutes({
      sessionStart,
      currentMinute: sessionStart.plus({ minutes: 3 }),
      timezone: 'Asia/Dhaka',
      yesterdayClose: 100,
      fallbackValue: 99,
      ticks: [
        {
          id: 1,
          eventTime: sessionStart.plus({ seconds: 15 }).toJSDate(),
          value: 101,
        },
        {
          id: 2,
          eventTime: sessionStart.plus({ minutes: 2, seconds: 10 }).toJSDate(),
          value: 98,
        },
        {
          id: 3,
          eventTime: sessionStart.plus({ minutes: 2, seconds: 45 }).toJSDate(),
          value: 100,
        },
      ],
    });

    expect(points).toHaveLength(4);
    expect(points.map((point) => point.value)).toEqual([101, 101, 100, 100]);
    expect(points.map((point) => point.status)).toEqual([
      'above',
      'above',
      'equal',
      'equal',
    ]);
  });

  it('falls back to yesterday close when no ticks are available', () => {
    const points = normalizeTicksToMinutes({
      sessionStart,
      currentMinute: sessionStart.plus({ minutes: 1 }),
      timezone: 'Asia/Dhaka',
      yesterdayClose: 100,
      fallbackValue: 100,
      ticks: [],
    });

    expect(points.map((point) => point.value)).toEqual([100, 100]);
    expect(points.map((point) => point.status)).toEqual(['equal', 'equal']);
  });

  it('uses fallback value for initial minutes before the first tick', () => {
    const points = normalizeTicksToMinutes({
      sessionStart,
      currentMinute: sessionStart.plus({ minutes: 3 }),
      timezone: 'Asia/Dhaka',
      yesterdayClose: 100,
      fallbackValue: 95,
      ticks: [
        {
          id: 1,
          eventTime: sessionStart.plus({ minutes: 2, seconds: 20 }).toJSDate(),
          value: 105,
        },
      ],
    });

    expect(points).toHaveLength(4);
    expect(points.map((point) => point.value)).toEqual([95, 95, 105, 105]);
    expect(points[0].status).toBe('below');
    expect(points[2].status).toBe('above');
  });

  it('returns a single point when currentMinute equals sessionStart', () => {
    const points = normalizeTicksToMinutes({
      sessionStart,
      currentMinute: sessionStart,
      timezone: 'Asia/Dhaka',
      yesterdayClose: 100,
      fallbackValue: 100,
      ticks: [],
    });

    expect(points).toHaveLength(1);
    expect(points[0].minute).toBe('10:00');
  });

  it('handles ticks at exact minute boundaries', () => {
    const points = normalizeTicksToMinutes({
      sessionStart,
      currentMinute: sessionStart.plus({ minutes: 1 }),
      timezone: 'Asia/Dhaka',
      yesterdayClose: 100,
      fallbackValue: 100,
      ticks: [
        {
          id: 1,
          eventTime: sessionStart.toJSDate(),
          value: 102,
        },
        {
          id: 2,
          eventTime: sessionStart.plus({ minutes: 1 }).toJSDate(),
          value: 98,
        },
      ],
    });

    expect(points.map((point) => point.value)).toEqual([102, 98]);
    expect(points[0].status).toBe('above');
    expect(points[1].status).toBe('below');
  });

  it('correctly labels minutes', () => {
    const points = normalizeTicksToMinutes({
      sessionStart,
      currentMinute: sessionStart.plus({ minutes: 2 }),
      timezone: 'Asia/Dhaka',
      yesterdayClose: 100,
      fallbackValue: 100,
      ticks: [],
    });

    expect(points.map((point) => point.minute)).toEqual(['10:00', '10:01', '10:02']);
  });
});
