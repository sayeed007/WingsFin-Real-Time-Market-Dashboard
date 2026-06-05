import compression from 'compression';
import cors from 'cors';
import { randomUUID } from 'crypto';
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

type AuditResponseLocals = {
  audit?: {
    requestId: string;
    startedAt: number;
    error?: {
      name: string;
      message?: string;
      statusCode: number;
    };
  };
};

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
  app.use('/api', (req: Request, res: Response<unknown, AuditResponseLocals>, next: NextFunction) => {
    const requestId = randomUUID();
    res.locals.audit = {
      requestId,
      startedAt: Date.now(),
    };
    res.setHeader('X-Request-Id', requestId);

    res.on('finish', () => {
      const durationMs = Date.now() - (res.locals.audit?.startedAt ?? Date.now());
      const isError = res.statusCode >= 400;
      const error = res.locals.audit?.error;
      const userAgent = req.headers['user-agent'];

      logAuditEvent({
        category: 'API',
        action: isError ? 'API_ERROR' : 'API_REQUEST',
        actor: req.ip ?? 'unknown',
        severity: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO',
        durationMs,
        meta: {
          requestId,
          method: req.method,
          path: `${req.baseUrl}${req.path}`,
          statusCode: res.statusCode,
          ...(typeof userAgent === 'string' ? { userAgent } : {}),
          ...(error ? { error } : {}),
        },
      });
    });
    next();
  });

  app.use('/api', BaseRouter);

  app.use((err: Error, _req: Request, res: Response<unknown, AuditResponseLocals>, _next: NextFunction) => {
    if (res.headersSent) {
      return;
    }

    const status = err instanceof HttpError ? err.status : 500;
    const message = status === 500 ? 'Internal server error.' : err.message;
    if (res.locals.audit) {
      res.locals.audit.error = {
        name: err.name,
        statusCode: status,
        ...(status === 500 ? {} : { message: err.message }),
      };
    }
    if (env.nodeEnv !== 'test') {
      logger.error(err, 'Unhandled request error');
    }
    res.status(status).json({ error: message });
  });

  return app;
}

export default createApp();
