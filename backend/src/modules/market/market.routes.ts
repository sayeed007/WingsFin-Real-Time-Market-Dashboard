import { Router } from 'express';

import { getMarketStatus } from '@src/modules/market/market.service';

export const marketRouter = Router();

marketRouter.get('/status', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=5');
  res.json(getMarketStatus());
});
