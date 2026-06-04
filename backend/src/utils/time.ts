import { DateTime } from 'luxon';

import { env } from '@src/config/env';

export type MarketSession = {
  timezone: string;
  currentTime: DateTime;
  sessionStart: DateTime;
  sessionEnd: DateTime;
};

function parseMarketTime(value: string): { hour: number; minute: number } {
  const [hour, minute] = value.split(':').map(Number);
  return { hour, minute };
}

export function getMarketSession(
  now: DateTime = DateTime.utc(),
  timezone = env.marketTimezone,
): MarketSession {
  const currentTime = now.setZone(timezone);
  const open = parseMarketTime(env.marketOpenTime);
  const close = parseMarketTime(env.marketCloseTime);

  return {
    timezone,
    currentTime,
    sessionStart: currentTime.set({
      hour: open.hour,
      minute: open.minute,
      second: 0,
      millisecond: 0,
    }),
    sessionEnd: currentTime.set({
      hour: close.hour,
      minute: close.minute,
      second: 0,
      millisecond: 0,
    }),
  };
}

export function isWithinSession(time: DateTime, session: MarketSession): boolean {
  const zoned = time.setZone(session.timezone);
  return zoned >= session.sessionStart && zoned < session.sessionEnd;
}

export function toIso(dateTime: DateTime): string {
  return dateTime.toISO({ suppressMilliseconds: true }) ?? dateTime.toISO() ?? '';
}

export function toMinuteKey(dateTime: DateTime, timezone = env.marketTimezone): string {
  return toIso(dateTime.setZone(timezone).startOf('minute'));
}

export function toMinuteLabel(dateTime: DateTime, timezone = env.marketTimezone): string {
  return dateTime.setZone(timezone).toFormat('HH:mm');
}

export function fromEpochMillis(time: number): DateTime {
  return DateTime.fromMillis(time, { zone: 'utc' });
}
