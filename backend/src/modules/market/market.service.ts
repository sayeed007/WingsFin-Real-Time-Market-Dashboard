import { DateTime } from 'luxon';

import { env } from '@src/config/env';
import type { MarketStatusResponse } from '@src/modules/market/market.types';
import { getMarketSession, isWithinSession, toIso } from '@src/utils/time';

export function getMarketStatus(now: DateTime = DateTime.utc()): MarketStatusResponse {
  const session = getMarketSession(now);
  const isOpen = isWithinSession(session.currentTime, session);

  return {
    isOpen,
    timezone: session.timezone,
    marketOpenTime: env.marketOpenTime,
    marketCloseTime: env.marketCloseTime,
    sessionStart: toIso(session.sessionStart),
    sessionEnd: toIso(session.sessionEnd),
    currentTime: toIso(session.currentTime),
    ...(isOpen ? {} : { message: 'Market is currently closed.' }),
  };
}

export function isMarketOpen(now: DateTime = DateTime.utc()): boolean {
  const session = getMarketSession(now);
  return isWithinSession(session.currentTime, session);
}
