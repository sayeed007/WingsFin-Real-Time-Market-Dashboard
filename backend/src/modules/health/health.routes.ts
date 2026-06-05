import { Router } from 'express';

import { prisma } from '@src/db/prisma';
import { asyncHandler } from '@src/utils/http';

export const healthRouter = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     description: Returns service status and current server time. Also verifies database connectivity.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 time:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Database unavailable
 */
healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
    });
  }),
);

