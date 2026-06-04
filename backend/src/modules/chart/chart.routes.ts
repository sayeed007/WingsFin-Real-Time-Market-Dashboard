import { Router } from 'express';

import { getChartHistory } from '@src/modules/chart/chart.service';
import { symbolTypeSchema } from '@src/validation/marketPayload.schema';
import { asyncHandler, HttpError } from '@src/utils/http';

export const chartRouter = Router();

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
