import { config as loadDotenv } from 'dotenv';

loadDotenv();

export type AppEnv = {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  marketTimezone: string;
  marketOpenTime: string;
  marketCloseTime: string;
  defaultIndexId: string;
  defaultStockTradeCode: string;
  indexYesterdayClose: number;
  stockYesterdayClose: number;
  simulatorEnabled: boolean;
  simulatorMinIntervalMs: number;
  simulatorMaxIntervalMs: number;
  corsOrigin: string;
};

function readNumber(name: string, fallback: number): number {
  const value = process.env[name];
  if (value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${name} must be a number.`);
  }
  return parsed;
}

function readBoolean(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined || value === '') {
    return fallback;
  }
  return value.toLowerCase() === 'true';
}

function readString(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

function assertMarketTime(name: string, value: string): void {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error(`${name} must use HH:mm format.`);
  }
  const [hour, minute] = value.split(':').map(Number);
  if (hour > 23 || minute > 59) {
    throw new Error(`${name} must be a valid HH:mm time.`);
  }
}

const marketOpenTime = readString('MARKET_OPEN_TIME', '10:00');
const marketCloseTime = readString('MARKET_CLOSE_TIME', '14:30');

assertMarketTime('MARKET_OPEN_TIME', marketOpenTime);
assertMarketTime('MARKET_CLOSE_TIME', marketCloseTime);

export const env: AppEnv = {
  nodeEnv: readString('NODE_ENV', 'development'),
  port: readNumber('PORT', 4000),
  databaseUrl: readString(
    'DATABASE_URL',
    'postgresql://postgres:postgres@localhost:5432/wingsfin',
  ),
  marketTimezone: readString('MARKET_TIMEZONE', 'Asia/Dhaka'),
  marketOpenTime,
  marketCloseTime,
  defaultIndexId: readString('DEFAULT_INDEX_ID', 'DSEX'),
  defaultStockTradeCode: readString('DEFAULT_STOCK_TRADE_CODE', 'GP'),
  indexYesterdayClose: readNumber('INDEX_YESTERDAY_CLOSE', 5200),
  stockYesterdayClose: readNumber('STOCK_YESTERDAY_CLOSE', 238.88),
  simulatorEnabled: readBoolean('SIMULATOR_ENABLED', true),
  simulatorMinIntervalMs: readNumber('SIMULATOR_MIN_INTERVAL_MS', 300),
  simulatorMaxIntervalMs: readNumber('SIMULATOR_MAX_INTERVAL_MS', 3000),
  corsOrigin: readString('CORS_ORIGIN', 'http://localhost:5173'),
};
