import { rateLimit } from 'express-rate-limit';
import { Router } from 'express';

import {
  recordIndexUpdate,
  recordStockUpdate,
} from '@src/modules/simulator/simulator.service';
import {
  indexUpdateSchema,
  stockUpdateSchema,
} from '@src/validation/marketPayload.schema';
import { asyncHandler, HttpError } from '@src/utils/http';

export const simulatorRouter = Router();

const simulateLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  message: { error: 'Too many simulation requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

simulatorRouter.use(simulateLimiter);

/**
 * @swagger
 * /api/simulate/index:
 *   post:
 *     summary: Ingest an index market update
 *     description: >
 *       Records a new market tick for an index symbol (e.g. DSEX).
 *       Validates the timestamp is not in the future and that the market is open.
 *       Triggers a WebSocket broadcast to all connected clients.
 *       Rate limited to 120 requests/minute.
 *     tags: [Simulator]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [index_id, capital_value, percentage_change_from_yesterday_close_value]
 *             properties:
 *               index_id:
 *                 type: string
 *                 example: DSEX
 *               capital_value:
 *                 type: number
 *                 example: 5234.56
 *               percentage_change_from_yesterday_close_value:
 *                 type: number
 *                 example: 0.65
 *               time:
 *                 type: integer
 *                 description: Unix epoch milliseconds (defaults to now)
 *     responses:
 *       201:
 *         description: Tick recorded and broadcast
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MarketUpdatePayload'
 *       400:
 *         description: Invalid payload
 *       409:
 *         description: Market is closed or future timestamp
 *       429:
 *         description: Rate limit exceeded
 */
simulatorRouter.post(
  '/index',
  asyncHandler(async (req, res) => {
    const result = indexUpdateSchema.safeParse(req.body);
    if (!result.success) {
      throw new HttpError(400, result.error.message);
    }
    res.status(201).json(await recordIndexUpdate(result.data));
  }),
);

/**
 * @swagger
 * /api/simulate/stock:
 *   post:
 *     summary: Ingest a stock market update
 *     description: >
 *       Records a new market tick for a stock symbol (e.g. GP).
 *       Validates the timestamp is not in the future and that the market is open.
 *       Triggers a WebSocket broadcast to all connected clients.
 *       Rate limited to 120 requests/minute.
 *     tags: [Simulator]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [trade_code, close_price, yesterday_close_price]
 *             properties:
 *               trade_code:
 *                 type: string
 *                 example: GP
 *               close_price:
 *                 type: number
 *                 example: 239.50
 *               yesterday_close_price:
 *                 type: number
 *                 example: 238.88
 *               time:
 *                 type: integer
 *                 description: Unix epoch milliseconds (defaults to now)
 *     responses:
 *       201:
 *         description: Tick recorded and broadcast
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MarketUpdatePayload'
 *       400:
 *         description: Invalid payload
 *       409:
 *         description: Market is closed or future timestamp
 *       429:
 *         description: Rate limit exceeded
 */
simulatorRouter.post(
  '/stock',
  asyncHandler(async (req, res) => {
    const result = stockUpdateSchema.safeParse(req.body);
    if (!result.success) {
      throw new HttpError(400, result.error.message);
    }
    res.status(201).json(await recordStockUpdate(result.data));
  }),
);

