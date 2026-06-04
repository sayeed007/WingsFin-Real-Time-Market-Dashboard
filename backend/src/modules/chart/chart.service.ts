import { DateTime } from 'luxon';

import { prisma } from '@src/db/prisma';
import {
  normalizeTicksToMinutes,
  type RawTickForNormalization,
} from '@src/modules/chart/chart.normalizer';
import type {
  ChartHistoryResponse,
  SymbolType,
} from '@src/modules/market/market.types';
import { KeyedTtlCache } from '@src/utils/cache';
import { getMarketSession, isWithinSession, toIso } from '@src/utils/time';

const historyCache = new KeyedTtlCache<ChartHistoryResponse>(10_000);

function historyCachePrefix(type: SymbolType, symbol: string): string {
  return `${type}:${symbol}:`;
}

function historyCacheKey(
  type: SymbolType,
  symbol: string,
  currentMinute: DateTime,
): string {
  return `${historyCachePrefix(type, symbol)}${toIso(currentMinute)}`;
}

export function invalidateChartHistoryCache(params: {
  type: SymbolType;
  symbol: string;
}): void {
  historyCache.invalidatePrefix(historyCachePrefix(params.type, params.symbol));
}

export async function getChartHistory(params: {
  type: SymbolType;
  symbol: string;
  now?: DateTime;
}): Promise<ChartHistoryResponse> {
  const now = params.now ?? DateTime.utc();
  const session = getMarketSession(now);
  const currentMinute = session.currentTime.startOf('minute');
  const isMarketOpen = isWithinSession(session.currentTime, session);

  const cacheKey = historyCacheKey(params.type, params.symbol, currentMinute);
  const cached = historyCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const symbol = await prisma.symbol.findUnique({
    where: { symbol: params.symbol },
  });

  if (!symbol || symbol.type !== params.type) {
    throw new Error(
      `Unknown ${params.type.toLowerCase()} symbol ${params.symbol}.`,
    );
  }

  const yesterdayClose = symbol.yesterdayClose.toNumber();

  if (!isMarketOpen) {
    return {
      symbol: params.symbol,
      type: params.type,
      isMarketOpen,
      timezone: session.timezone,
      sessionStart: toIso(session.sessionStart),
      sessionEnd: toIso(session.sessionEnd),
      currentMinute: toIso(currentMinute),
      yesterdayClose,
      latestValue: yesterdayClose,
      points: [],
    };
  }

  const ticks = await prisma.marketTick.findMany({
    where: {
      symbol: params.symbol,
      type: params.type,
      eventTime: {
        gte: session.sessionStart.toJSDate(),
        lte: currentMinute.plus({ seconds: 59, milliseconds: 999 }).toJSDate(),
      },
    },
    orderBy: [{ eventTime: 'asc' }, { id: 'asc' }],
  });

  const fallbackTick = await prisma.marketTick.findFirst({
    where: {
      symbol: params.symbol,
      type: params.type,
      eventTime: {
        lt: session.sessionStart.toJSDate(),
      },
    },
    orderBy: [{ eventTime: 'desc' }, { id: 'desc' }],
  });

  const fallbackValue = fallbackTick?.value.toNumber() ?? yesterdayClose;
  const normalizedTicks: RawTickForNormalization[] = ticks.map(
    (tick: (typeof ticks)[number]) => ({
      id: tick.id,
      eventTime: tick.eventTime,
      value: tick.value.toNumber(),
    }),
  );

  const points = normalizeTicksToMinutes({
    sessionStart: session.sessionStart,
    currentMinute,
    timezone: session.timezone,
    yesterdayClose,
    fallbackValue,
    ticks: normalizedTicks,
  });

  const result: ChartHistoryResponse = {
    symbol: params.symbol,
    type: params.type,
    isMarketOpen,
    timezone: session.timezone,
    sessionStart: toIso(session.sessionStart),
    sessionEnd: toIso(session.sessionEnd),
    currentMinute: toIso(currentMinute),
    yesterdayClose,
    latestValue:
      points.length > 0 ? points[points.length - 1].value : fallbackValue,
    points,
  };

  historyCache.set(cacheKey, result);
  return result;
}
