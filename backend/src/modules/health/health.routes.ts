import { Router } from 'express';

import { prisma } from '@src/db/prisma';
import { asyncHandler } from '@src/utils/http';

export const healthRouter = Router();

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
