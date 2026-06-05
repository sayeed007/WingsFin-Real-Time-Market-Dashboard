import { createServer } from 'http';

import { env } from '@src/config/env';
import { logger } from '@src/config/logger';
import { prisma } from '@src/db/prisma';
import {
  startMarketClock,
  stopMarketClock,
} from '@src/modules/market/market.clock';
import {
  attachSocketServer,
  closeSocketServer,
} from '@src/modules/realtime/socket.server';
import {
  startSimulator,
  stopSimulator,
} from '@src/modules/simulator/simulator.service';
import { ensureDefaultSymbols } from '@src/modules/symbols/symbols.service';
import app from '@src/server';

const httpServer = createServer(app);
let shuttingDown = false;

attachSocketServer(httpServer);

async function waitForDatabase(retries = 5, delayMs = 2000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info('Database connection established');
      return;
    } catch (error) {
      logger.warn(
        { attempt, retries, error: (error as Error).message },
        'Database not ready, retrying...',
      );
      if (attempt === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
}

async function bootstrap(): Promise<void> {
  await waitForDatabase();
  await ensureDefaultSymbols();

  // Always run the market clock so `market:closed` is emitted on the
  // open -> closed transition regardless of whether the simulator is enabled.
  startMarketClock();

  if (env.simulatorEnabled) {
    await startSimulator();
    logger.info('Simulator started');
  }

  httpServer.listen(env.port, () => {
    logger.info(`WingsFin backend listening on port ${env.port}`);
  });
}

function shutdown(): void {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.info('Shutting down...');
  stopMarketClock();
  stopSimulator();
  void closeSocketServer()
    .catch((error) => {
      logger.error(error, 'Socket server shutdown failed');
    })
    .finally(() => {
      void prisma.$disconnect().finally(() => {
        process.exit(0);
      });
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

void bootstrap().catch((error) => {
  logger.fatal(error, 'Backend startup failed');
  void prisma.$disconnect().finally(() => process.exit(1));
});
