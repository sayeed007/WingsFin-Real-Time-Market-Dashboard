import { Router } from 'express';

import { getChartHistory } from '@src/modules/chart/chart.service';
import { symbolTypeSchema } from '@src/validation/marketPayload.schema';
import { asyncHandler, HttpError } from '@src/utils/http';

export const chartRouter = Router();

/**
 * @swagger
 * /api/chart/history:
 *   get:
 *     summary: Get chart history for a symbol
 *     description: >
 *       Returns minute-by-minute OHLC/close chart data for the current trading session.
 *       When the market is closed, returns an empty points array with the last known value.
 *       Results are cached per minute boundary.
 *     tags: [Chart]
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [INDEX, STOCK]
 *         description: Symbol type
 *       - in: query
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Symbol identifier (e.g. DSEX, GP)
 *     responses:
 *       200:
 *         description: Chart history for the current session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 symbol:
 *                   type: string
 *                 type:
 *                   type: string
 *                   enum: [INDEX, STOCK]
 *                 isMarketOpen:
 *                   type: boolean
 *                 timezone:
 *                   type: string
 *                 sessionStart:
 *                   type: string
 *                   format: date-time
 *                 sessionEnd:
 *                   type: string
 *                   format: date-time
 *                 currentMinute:
 *                   type: string
 *                   format: date-time
 *                 yesterdayClose:
 *                   type: number
 *                 latestValue:
 *                   type: number
 *                 points:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChartPoint'
 *       400:
 *         description: Missing or invalid query parameters
 *       404:
 *         description: Symbol not found
 */
chartRouter.get(
  '/history',
  asyncHandler(async (req, res) => {
    const typeResult = symbolTypeSchema.safeParse(req.query.type);
    const symbol = typeof req.query.symbol === 'string' ? req.query.symbol : '';

    if (!typeResult.success || !symbol) {
      throw new HttpError(400, 'type and symbol query parameters are required.');
    }

    res.json(
      await getChartHistory({
        type: typeResult.data,
        symbol,
      }),
    );
  }),
);

