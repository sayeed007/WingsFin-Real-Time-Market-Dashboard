import { rateLimit } from 'express-rate-limit';
import { Router } from 'express';

import { asyncHandler } from '@src/utils/http';
import { queryAuditEvents } from '@src/modules/audit/audit.service';
import type { AuditCategory, AuditSeverity } from '@src/modules/audit/audit.service';

export const auditRouter = Router();

const auditReadLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  message: { error: 'Too many audit requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

auditRouter.use(auditReadLimiter);

/**
 * @swagger
 * /api/audit/events:
 *   get:
 *     summary: Query audit trail events
 *     description: >
 *       Returns persisted financial audit events from the database.
 *       Use query parameters to filter by category, severity, symbol, or time range.
 *     tags: [Audit]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [MARKET_DATA, SIMULATOR, REALTIME, SESSION, SYSTEM, API]
 *         description: Filter by event category
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [INFO, WARN, ERROR]
 *         description: Filter by severity level
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *         description: Filter by market symbol (e.g. DSEX, GP)
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start of time range (ISO 8601)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End of time range (ISO 8601)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 500
 *           default: 100
 *         description: Maximum number of events to return
 *     responses:
 *       200:
 *         description: List of audit events ordered by timestamp descending
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditEvent'
 *                 count:
 *                   type: integer
 */
auditRouter.get(
  '/events',
  asyncHandler(async (req, res) => {
    const category = req.query.category as AuditCategory | undefined;
    const severity = req.query.severity as AuditSeverity | undefined;
    const symbol = typeof req.query.symbol === 'string' ? req.query.symbol : undefined;
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 100;

    const events = await queryAuditEvents({ category, severity, symbol, from, to, limit });
    res.json({ events, count: events.length });
  }),
);
