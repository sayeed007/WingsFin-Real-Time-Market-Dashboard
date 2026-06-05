import { Router } from 'express';

import { getMarketStatus } from '@src/modules/market/market.service';

export const marketRouter = Router();

/**
 * @swagger
 * /api/market/status:
 *   get:
 *     summary: Get current market session status
 *     description: >
 *       Returns whether the Dhaka Stock Exchange is currently open,
 *       along with session start/end times and current server time in market timezone.
 *       Response is cached for 5 seconds.
 *     tags: [Market]
 *     responses:
 *       200:
 *         description: Market status object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MarketStatus'
 */
marketRouter.get('/status', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=5');
  res.json(getMarketStatus());
});

