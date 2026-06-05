import { Router } from 'express';

import { listSymbols } from '@src/modules/symbols/symbols.service';
import { asyncHandler } from '@src/utils/http';

export const symbolsRouter = Router();

/**
 * @swagger
 * /api/symbols:
 *   get:
 *     summary: List all tradeable symbols
 *     description: >
 *       Returns all registered market symbols (indices and stocks).
 *       Response is cached for 5 minutes.
 *     tags: [Symbols]
 *     responses:
 *       200:
 *         description: Array of symbols
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 symbols:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       symbol:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [INDEX, STOCK]
 *                       displayName:
 *                         type: string
 *                       yesterdayClose:
 *                         type: number
 */
symbolsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.set('Cache-Control', 'public, max-age=300');
    res.json(await listSymbols());
  }),
);

