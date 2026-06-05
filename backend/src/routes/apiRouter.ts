import { Router } from 'express';

import { auditRouter } from '@src/modules/audit/audit.routes';
import { chartRouter } from '@src/modules/chart/chart.routes';
import { healthRouter } from '@src/modules/health/health.routes';
import { marketRouter } from '@src/modules/market/market.routes';
import { simulatorRouter } from '@src/modules/simulator/simulator.routes';
import { symbolsRouter } from '@src/modules/symbols/symbols.routes';

const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/market', marketRouter);
apiRouter.use('/symbols', symbolsRouter);
apiRouter.use('/chart', chartRouter);
apiRouter.use('/simulate', simulatorRouter);
apiRouter.use('/audit', auditRouter);

export default apiRouter;

