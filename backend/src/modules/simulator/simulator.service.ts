import { DateTime } from 'luxon';
import type { InputJsonValue } from '@prisma/client/runtime/library';

import { env } from '@src/config/env';
import { logger } from '@src/config/logger';
import { prisma } from '@src/db/prisma';
import type { MarketUpdatePayload, SymbolType } from '@src/modules/market/market.types';
import { isMarketOpen } from '@src/modules/market/market.service';
import { emitMarketClosed, emitMarketUpdate } from '@src/modules/realtime/socket.server';
import { ensureDefaultSymbols } from '@src/modules/symbols/symbols.service';
import type {
  IndexUpdateInput,
  StockUpdateInput,
} from '@src/validation/marketPayload.schema';
import { compareToReference, roundMarketValue } from '@src/utils/compare';
import { HttpError } from '@src/utils/http';
import { fromEpochMillis, getMarketSession, isWithinSession, toIso } from '@src/utils/time';

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

let closedEventEmitted = false;

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
  await prisma.symbol.upsert({
    where: { symbol: params.symbol },
    update: {
      type: params.type,
      yesterdayClose: params.yesterdayClose,
    },
    create: {
      symbol: params.symbol,
      type: params.type,
      displayName:
        params.type === 'INDEX' ? `${params.symbol} Index` : params.symbol,
      yesterdayClose: params.yesterdayClose,
    },
  });

  await prisma.marketTick.create({
    data: {
      symbol: params.symbol,
      type: params.type,
      eventTime: params.eventTime.toJSDate(),
      value: params.value,
      yesterdayClose: params.yesterdayClose,
      rawPayload: params.rawPayload,
    },
  });

  const update = createMarketUpdate(params);
  if (isMarketOpen()) {
    emitMarketUpdate(update);
  }
  return update;
}

export async function recordIndexUpdate(
  payload: IndexUpdateInput,
): Promise<MarketUpdatePayload> {
  const eventTime = payload.time ? fromEpochMillis(payload.time) : DateTime.utc();
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
  const eventTime = payload.time ? fromEpochMillis(payload.time) : DateTime.utc();
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
    if (!isMarketOpen()) {
      if (!closedEventEmitted) {
        emitMarketClosed({
          message: 'Market is now closed.',
          closedAt: toIso(DateTime.utc().setZone(env.marketTimezone)),
        });
        closedEventEmitted = true;
      }
      return;
    }

    closedEventEmitted = false;
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
  }
}

function schedule(state: SimulatorState): void {
  state.timer = setTimeout(() => {
    void tick(state).finally(() => schedule(state));
  }, randomInterval());
}

export async function startSimulator(): Promise<void> {
  if (!env.simulatorEnabled) {
    return;
  }

  await ensureDefaultSymbols();
  states.forEach(schedule);
}

export function stopSimulator(): void {
  for (const state of states) {
    if (state.timer) {
      clearTimeout(state.timer);
    }
  }
}
