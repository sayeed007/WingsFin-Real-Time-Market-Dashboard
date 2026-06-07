import { Prisma, PrismaClient } from '@prisma/client';
import { DateTime } from 'luxon';

import { env } from './config/env';
import { logger } from './config/logger';

const prisma = new PrismaClient();

type SeedInstrument = {
  type: 'INDEX' | 'STOCK';
  symbol: string;
  displayName: string;
  yesterdayClose: number;
  min: number;
  max: number;
  maxDelta: number;
};

type SeedWindowControls = {
  sessionDate?: string;
  untilTime?: string;
};

const instruments: SeedInstrument[] = [
  {
    type: 'INDEX',
    symbol: env.defaultIndexId,
    displayName: `${env.defaultIndexId} Index`,
    yesterdayClose: env.indexYesterdayClose,
    min: env.indexYesterdayClose - 100,
    max: env.indexYesterdayClose + 100,
    maxDelta: 10,
  },
  {
    type: 'STOCK',
    symbol: env.defaultStockTradeCode,
    displayName: env.defaultStockTradeCode,
    yesterdayClose: env.stockYesterdayClose,
    min: env.stockYesterdayClose - 1,
    max: env.stockYesterdayClose + 1,
    maxDelta: 0.1,
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function randomWalk(value: number, instrument: SeedInstrument): number {
  const delta = (Math.random() * 2 - 1) * instrument.maxDelta;
  return Number(
    clamp(value + delta, instrument.min, instrument.max).toFixed(4),
  );
}

function parseSeedUntilTime(
  untilTime = env.seedUntilTime,
): string | undefined {
  if (!untilTime) {
    return undefined;
  }

  if (!/^\d{2}:\d{2}$/.test(untilTime)) {
    throw new Error('SEED_UNTIL_TIME must use HH:mm format.');
  }

  const [hour, minute] = untilTime.split(':').map(Number);
  if (hour > 23 || minute > 59) {
    throw new Error('SEED_UNTIL_TIME must be a valid HH:mm time.');
  }

  return untilTime;
}

function clampDateTime(value: DateTime, min: DateTime, max: DateTime): DateTime {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
}

export function seedWindow(
  now: DateTime = DateTime.now(),
  controls: SeedWindowControls = {},
): {
  start: DateTime;
  end: DateTime;
} {
  const marketNow = now.setZone(env.marketTimezone);
  const today = marketNow.toISODate();
  const sessionDate =
    controls.sessionDate || env.seedSessionDate || today;
  const configuredUntilTime = parseSeedUntilTime(controls.untilTime);
  const start = DateTime.fromISO(`${sessionDate}T${env.marketOpenTime}`, {
    zone: env.marketTimezone,
  });
  const close = DateTime.fromISO(`${sessionDate}T${env.marketCloseTime}`, {
    zone: env.marketTimezone,
  });

  const dynamicEnd =
    configuredUntilTime === undefined && sessionDate === today
      ? marketNow.startOf('minute')
      : close;
  const requestedEnd =
    configuredUntilTime === undefined
      ? dynamicEnd
      : DateTime.fromISO(`${sessionDate}T${configuredUntilTime}`, {
          zone: env.marketTimezone,
        });

  return { start, end: clampDateTime(requestedEnd, start, close) };
}

async function seedInstrument(instrument: SeedInstrument): Promise<void> {
  await prisma.symbol.upsert({
    where: { symbol: instrument.symbol },
    update: {
      type: instrument.type,
      displayName: instrument.displayName,
      yesterdayClose: instrument.yesterdayClose,
    },
    create: {
      symbol: instrument.symbol,
      type: instrument.type,
      displayName: instrument.displayName,
      yesterdayClose: instrument.yesterdayClose,
    },
  });

  await prisma.marketTick.deleteMany({
    where: {
      symbol: instrument.symbol,
      type: instrument.type,
    },
  });

  const { start, end } = seedWindow();
  let cursor = start;
  let value = instrument.yesterdayClose;
  const rows: Prisma.MarketTickCreateManyInput[] = [];

  while (cursor <= end) {
    const skipMinute = Math.random() < 0.22;
    if (!skipMinute) {
      const updatesInMinute = Math.random() < 0.3 ? 2 : 1;

      for (let index = 0; index < updatesInMinute; index += 1) {
        value = randomWalk(value, instrument);
        const eventTime = cursor.plus({
          seconds:
            updatesInMinute === 1
              ? Math.floor(Math.random() * 50)
              : 10 + index * 35,
        });
        rows.push({
          symbol: instrument.symbol,
          type: instrument.type,
          eventTime: eventTime.toJSDate(),
          value,
          yesterdayClose: instrument.yesterdayClose,
          rawPayload:
            instrument.type === 'INDEX'
              ? {
                  index_id: instrument.symbol,
                  time: eventTime.toMillis(),
                  capital_value: value,
                  percentage_change_from_yesterday_close_value:
                    ((value - instrument.yesterdayClose) /
                      instrument.yesterdayClose) *
                    100,
                }
              : {
                  trade_code: instrument.symbol,
                  time: eventTime.toMillis(),
                  close_price: value,
                  yesterday_close_price: instrument.yesterdayClose,
                },
        });
      }
    }

    cursor = cursor.plus({ minutes: 1 });
  }

  if (rows.length > 0) {
    await prisma.marketTick.createMany({ data: rows });
  }

  logger.info({ rows: rows.length, symbol: instrument.symbol }, 'Seeded ticks');
}

export async function runSeed(): Promise<void> {
  for (const instrument of instruments) {
    await seedInstrument(instrument);
  }
}

export async function disconnectSeedPrisma(): Promise<void> {
  await prisma.$disconnect();
}
