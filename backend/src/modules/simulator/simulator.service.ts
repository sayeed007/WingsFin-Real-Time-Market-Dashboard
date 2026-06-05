import type { InputJsonValue } from '@prisma/client/runtime/library';
import { DateTime } from 'luxon';

import { env } from '@src/config/env';
import { logger } from '@src/config/logger';
import { prisma } from '@src/db/prisma';
import { logAuditEvent } from '@src/modules/audit/audit.service';
import { invalidateChartHistoryCache } from '@src/modules/chart/chart.service';
import { isMarketOpen } from '@src/modules/market/market.service';
import type {
  MarketUpdatePayload,
  SymbolType,
} from '@src/modules/market/market.types';
import { emitMarketUpdate } from '@src/modules/realtime/socket.server';
import { ensureDefaultSymbols } from '@src/modules/symbols/symbols.service';
import { compareToReference, roundMarketValue } from '@src/utils/compare';
import { HttpError } from '@src/utils/http';
import {
  fromEpochMillis,
  getMarketSession,
  isWithinSession,
  toIso,
} from '@src/utils/time';
import type {
  IndexUpdateInput,
  StockUpdateInput,
} from '@src/validation/marketPayload.schema';

type SimulatorState = {
  type: SymbolType;
  symbol: string;
  value: number;
  yesterdayClose: number;
  min: number;
  max: number;
  maxDelta: number;
  timer?: NodeJS.Timeout;
};

const states: SimulatorState[] = [
  {
    type: 'INDEX',
    symbol: env.defaultIndexId,
    value: env.indexYesterdayClose,
    yesterdayClose: env.indexYesterdayClose,
    min: env.indexYesterdayClose - 100,
    max: env.indexYesterdayClose + 100,
    maxDelta: 10,
  },
  {
    type: 'STOCK',
    symbol: env.defaultStockTradeCode,
    value: env.stockYesterdayClose,
    yesterdayClose: env.stockYesterdayClose,
    min: env.stockYesterdayClose - 1,
    max: env.stockYesterdayClose + 1,
    maxDelta: 0.1,
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function randomInterval(): number {
  return Math.floor(
    env.simulatorMinIntervalMs +
      Math.random() * (env.simulatorMaxIntervalMs - env.simulatorMinIntervalMs),
  );
}

function randomWalk(state: SimulatorState): number {
  const delta = (Math.random() * 2 - 1) * state.maxDelta;
  return roundMarketValue(clamp(state.value + delta, state.min, state.max));
}

function createMarketUpdate(params: {
  type: SymbolType;
  symbol: string;
  eventTime: DateTime;
  value: number;
  yesterdayClose: number;
}): MarketUpdatePayload {
  const minuteTime = params.eventTime.startOf('minute');
  return {
    symbol: params.symbol,
    type: params.type,
    time: toIso(params.eventTime.setZone(env.marketTimezone)),
    minuteTime: toIso(minuteTime.setZone(env.marketTimezone)),
    value: roundMarketValue(params.value),
    yesterdayClose: roundMarketValue(params.yesterdayClose),
    status: compareToReference(params.value, params.yesterdayClose),
  };
}

function assertAcceptableEventTime(eventTime: DateTime): void {
  if (eventTime > DateTime.utc().plus({ minutes: 1 })) {
    throw new HttpError(400, 'Future timestamps are not accepted.');
  }

  const session = getMarketSession(eventTime);
  if (!isWithinSession(eventTime, session)) {
    throw new HttpError(409, 'Market is closed for the update timestamp.');
  }
}

async function recordTick(params: {
  type: SymbolType;
  symbol: string;
  eventTime: DateTime;
  value: number;
  yesterdayClose: number;
  rawPayload: InputJsonValue;
}): Promise<MarketUpdatePayload> {
  const symbol =
    (await prisma.symbol.findUnique({
      where: { symbol: params.symbol },
    })) ??
    (await prisma.symbol.create({
      data: {
        symbol: params.symbol,
        type: params.type,
        displayName:
          params.type === 'INDEX' ? `${params.symbol} Index` : params.symbol,
        yesterdayClose: params.yesterdayClose,
      },
    }));

  if (symbol.type !== params.type) {
    throw new HttpError(
      409,
      `Symbol ${params.symbol} is already registered as ${symbol.type}.`,
    );
  }

  const referenceClose = symbol.yesterdayClose.toNumber();

  await prisma.marketTick.create({
    data: {
      symbol: params.symbol,
      type: params.type,
      eventTime: params.eventTime.toJSDate(),
      value: params.value,
      yesterdayClose: referenceClose,
      rawPayload: params.rawPayload,
    },
  });
  invalidateChartHistoryCache({ type: params.type, symbol: params.symbol });

  logAuditEvent({
    category: 'MARKET_DATA',
    action: 'TICK_PERSISTED',
    actor: 'simulator.service',
    symbol: params.symbol,
    symbolType: params.type,
    value: params.value,
    meta: { yesterdayClose: referenceClose },
  });

  const update = createMarketUpdate({
    ...params,
    yesterdayClose: referenceClose,
  });
  if (isMarketOpen()) {
    emitMarketUpdate(update);
    logAuditEvent({
      category: 'REALTIME',
      action: 'TICK_EMITTED',
      actor: 'simulator.service',
      symbol: params.symbol,
      symbolType: params.type,
      value: params.value,
    });
  }
  return update;
}

export async function recordIndexUpdate(
  payload: IndexUpdateInput,
): Promise<MarketUpdatePayload> {
  const eventTime = payload.time
    ? fromEpochMillis(payload.time)
    : DateTime.utc();
  assertAcceptableEventTime(eventTime);

  const yesterdayClose =
    payload.capital_value /
    (1 + payload.percentage_change_from_yesterday_close_value / 100);

  return recordTick({
    type: 'INDEX',
    symbol: payload.index_id,
    eventTime,
    value: payload.capital_value,
    yesterdayClose,
    rawPayload: payload,
  });
}

export async function recordStockUpdate(
  payload: StockUpdateInput,
): Promise<MarketUpdatePayload> {
  const eventTime = payload.time
    ? fromEpochMillis(payload.time)
    : DateTime.utc();
  assertAcceptableEventTime(eventTime);

  return recordTick({
    type: 'STOCK',
    symbol: payload.trade_code,
    eventTime,
    value: payload.close_price,
    yesterdayClose: payload.yesterday_close_price,
    rawPayload: payload,
  });
}

async function tick(state: SimulatorState): Promise<void> {
  try {
    // The market clock owns the `market:closed` broadcast; the simulator just
    // stops generating data while the market is closed.
    if (!isMarketOpen()) {
      return;
    }

    state.value = randomWalk(state);
    const eventTime = DateTime.utc();

    if (state.type === 'INDEX') {
      await recordIndexUpdate({
        index_id: state.symbol,
        time: eventTime.toMillis(),
        capital_value: state.value,
        percentage_change_from_yesterday_close_value:
          ((state.value - state.yesterdayClose) / state.yesterdayClose) * 100,
      });
    } else {
      await recordStockUpdate({
        trade_code: state.symbol,
        time: eventTime.toMillis(),
        close_price: state.value,
        yesterday_close_price: state.yesterdayClose,
      });
    }
  } catch (error) {
    logger.error(error, 'Simulator tick failed');
    logAuditEvent({
      category: 'SIMULATOR',
      action: 'SIMULATOR_TICK',
      actor: 'simulator.service',
      severity: 'ERROR',
      symbol: state.symbol,
      symbolType: state.type,
      meta: { error: (error as Error).message },
    });
  }
}

function schedule(state: SimulatorState): void {
  state.timer = setTimeout(() => {
    void tick(state).finally(() => schedule(state));
  }, randomInterval());
}

async function hydrateStateFromLatestTick(
  state: SimulatorState,
): Promise<void> {
  const session = getMarketSession(DateTime.utc());
  const latestTick = await prisma.marketTick.findFirst({
    where: {
      symbol: state.symbol,
      type: state.type,
      eventTime: {
        gte: session.sessionStart.toJSDate(),
        lt: session.sessionEnd.toJSDate(),
      },
    },
    orderBy: [{ eventTime: 'desc' }, { id: 'desc' }],
  });

  if (latestTick) {
    state.value = clamp(latestTick.value.toNumber(), state.min, state.max);
  }
}

export async function startSimulator(): Promise<void> {
  if (!env.simulatorEnabled) {
    return;
  }

  await ensureDefaultSymbols();
  await Promise.all(states.map(hydrateStateFromLatestTick));
  states.forEach(schedule);
  logAuditEvent({
    category: 'SIMULATOR',
    action: 'SIMULATOR_STARTED',
    actor: 'simulator.service',
    meta: {
      symbols: states.map((s) => s.symbol),
      intervalRange: [env.simulatorMinIntervalMs, env.simulatorMaxIntervalMs],
    },
  });
}

export function stopSimulator(): void {
  for (const state of states) {
    if (state.timer) {
      clearTimeout(state.timer);
    }
  }
  logAuditEvent({
    category: 'SIMULATOR',
    action: 'SIMULATOR_STOPPED',
    actor: 'simulator.service',
  });
}
