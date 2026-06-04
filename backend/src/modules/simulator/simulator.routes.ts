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
