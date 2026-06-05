import compression from 'compression';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { env } from '@src/config/env';
import { logger } from '@src/config/logger';
import { swaggerSpec } from '@src/config/swagger';
import { logAuditEvent } from '@src/modules/audit/audit.service';
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

  // Swagger UI needs inline scripts — disable CSP only for the docs route
  app.use(
    '/api/docs',
    helmet({ contentSecurityPolicy: false }),
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'WingsFin API Docs',
      customCss: '.swagger-ui .topbar { background-color: #0f172a; }',
    }),
  );

  app.use(helmet());

  if (env.nodeEnv === 'development') {
    app.use(morgan('dev'));
  }

  // Audit middleware — log every API request
  app.use('/api', (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const isError = res.statusCode >= 400;
      logAuditEvent({
        category: 'API',
        action: isError ? 'API_ERROR' : 'API_REQUEST',
        actor: req.ip ?? 'unknown',
        severity: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO',
        durationMs,
        meta: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          userAgent: req.headers['user-agent'],
        },
      });
    });
    next();
  });

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
