import { env } from '@src/config/env';
import { prisma } from '@src/db/prisma';
import type { SymbolType } from '@src/modules/market/market.types';
import { TtlCache } from '@src/utils/cache';

type SymbolSeed = {
  symbol: string;
  type: SymbolType;
  displayName: string;
  yesterdayClose: number;
};

type SymbolListResult = {
  symbols: Array<{
    symbol: string;
    type: SymbolType;
    displayName: string | null;
    yesterdayClose: number;
  }>;
};

export const defaultSymbols: SymbolSeed[] = [
  {
    symbol: env.defaultIndexId,
    type: 'INDEX',
    displayName: `${env.defaultIndexId} Index`,
    yesterdayClose: env.indexYesterdayClose,
  },
  {
    symbol: env.defaultStockTradeCode,
    type: 'STOCK',
    displayName: env.defaultStockTradeCode,
    yesterdayClose: env.stockYesterdayClose,
  },
];

export async function ensureDefaultSymbols(): Promise<void> {
  await Promise.all(
    defaultSymbols.map((item) =>
      prisma.symbol.upsert({
        where: { symbol: item.symbol },
        update: {
          type: item.type,
          displayName: item.displayName,
          yesterdayClose: item.yesterdayClose,
        },
        create: {
          symbol: item.symbol,
          type: item.type,
          displayName: item.displayName,
          yesterdayClose: item.yesterdayClose,
        },
      }),
    ),
  );
  symbolsCache.invalidate();
}

const symbolsCache = new TtlCache<SymbolListResult>(5 * 60_000);

export async function listSymbols(): Promise<SymbolListResult> {
  const cached = symbolsCache.get();
  if (cached) {
    return cached;
  }

  const symbols = await prisma.symbol.findMany({
    orderBy: [{ type: 'asc' }, { symbol: 'asc' }],
  });

  const result: SymbolListResult = {
    symbols: symbols.map((item: (typeof symbols)[number]) => ({
      symbol: item.symbol,
      type: item.type,
      displayName: item.displayName,
      yesterdayClose: item.yesterdayClose.toNumber(),
    })),
  };

  symbolsCache.set(result);
  return result;
}
