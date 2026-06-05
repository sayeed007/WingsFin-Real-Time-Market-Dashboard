import { rateLimit } from 'express-rate-limit';
import { Router } from 'express';

import { queryAuditEvents } from '@src/modules/audit/audit.service';
import type { AuditCategory, AuditSeverity } from '@src/modules/audit/audit.service';
import { asyncHandler, HttpError } from '@src/utils/http';

export const auditRouter = Router();

const AUDIT_CATEGORIES = [
  'MARKET_DATA',
  'SIMULATOR',
  'REALTIME',
  'SESSION',
  'SYSTEM',
  'API',
] as const satisfies readonly AuditCategory[];

const AUDIT_SEVERITIES = [
  'INFO',
  'WARN',
  'ERROR',
] as const satisfies readonly AuditSeverity[];

const auditReadLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  message: { error: 'Too many audit requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

auditRouter.use(auditReadLimiter);

function getSingleQueryValue(name: string, value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  throw new HttpError(400, `${name} must be a single query value.`);
}

function parseAuditCategory(value: string | undefined): AuditCategory | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (AUDIT_CATEGORIES.includes(value as AuditCategory)) {
    return value as AuditCategory;
  }
  throw new HttpError(400, 'category must be one of MARKET_DATA, SIMULATOR, REALTIME, SESSION, SYSTEM, API.');
}

function parseAuditSeverity(value: string | undefined): AuditSeverity | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (AUDIT_SEVERITIES.includes(value as AuditSeverity)) {
    return value as AuditSeverity;
  }
  throw new HttpError(400, 'severity must be one of INFO, WARN, ERROR.');
}

function parseIsoDate(name: string, value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, `${name} must be a valid ISO 8601 date-time.`);
  }
  return parsed.toISOString();
}

function parseLimit(value: string | undefined): number {
  if (value === undefined) {
    return 100;
  }
  if (!/^\d+$/.test(value)) {
    throw new HttpError(400, 'limit must be an integer from 1 to 500.');
  }
  const parsed = Number(value);
  if (parsed < 1 || parsed > 500) {
    throw new HttpError(400, 'limit must be an integer from 1 to 500.');
  }
  return parsed;
}

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
    const category = parseAuditCategory(getSingleQueryValue('category', req.query.category));
    const severity = parseAuditSeverity(getSingleQueryValue('severity', req.query.severity));
    const symbol = getSingleQueryValue('symbol', req.query.symbol);
    const from = parseIsoDate('from', getSingleQueryValue('from', req.query.from));
    const to = parseIsoDate('to', getSingleQueryValue('to', req.query.to));
    const limit = parseLimit(getSingleQueryValue('limit', req.query.limit));

    if (from && to && new Date(from) > new Date(to)) {
      throw new HttpError(400, 'from must be earlier than or equal to to.');
    }

    const events = await queryAuditEvents({ category, severity, symbol, from, to, limit });
    res.json({ events, count: events.length });
  }),
);
