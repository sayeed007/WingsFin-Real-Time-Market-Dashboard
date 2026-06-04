import pino from 'pino';

import { env } from '@src/config/env';

export const logger = pino({
  level: env.nodeEnv === 'test' ? 'silent' : 'info',
  transport:
    env.nodeEnv === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});
