import compression from 'compression';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from '@src/config/env';
import { logger } from '@src/config/logger';
import BaseRouter from '@src/routes/apiRouter';
import { HttpError } from '@src/utils/http';

export function createApp(): express.Express {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin,
    }),
  );
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(helmet());

  if (env.nodeEnv === 'development') {
    app.use(morgan('dev'));
  }

  app.use('/api', BaseRouter);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) {
      return;
    }

    const status = err instanceof HttpError ? err.status : 500;
    const message = status === 500 ? 'Internal server error.' : err.message;
    if (env.nodeEnv !== 'test') {
      logger.error(err, 'Unhandled request error');
    }
    res.status(status).json({ error: message });
  });

  return app;
}

export default createApp();
