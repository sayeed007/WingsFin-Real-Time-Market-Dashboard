import { logger } from './config/logger';
import { disconnectSeedPrisma, runSeed } from './seed';

void runSeed()
  .catch((error) => {
    logger.error(error, 'Seed failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectSeedPrisma();
  });
