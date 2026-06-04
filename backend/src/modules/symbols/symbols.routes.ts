import { Router } from 'express';

import { listSymbols } from '@src/modules/symbols/symbols.service';
import { asyncHandler } from '@src/utils/http';

export const symbolsRouter = Router();

symbolsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.set('Cache-Control', 'public, max-age=300');
    res.json(await listSymbols());
  }),
);
