import type { AuditCategory, AuditSeverity, SymbolType } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { logger } from '@src/config/logger';
import { prisma } from '@src/db/prisma';

export type { AuditCategory, AuditSeverity };

export type AuditAction =
  | 'TICK_RECEIVED'
  | 'TICK_PERSISTED'
  | 'TICK_EMITTED'
  | 'MARKET_OPEN'
  | 'MARKET_CLOSED'
  | 'SIMULATOR_TICK'
  | 'SIMULATOR_STARTED'
  | 'SIMULATOR_STOPPED'
  | 'API_REQUEST'
  | 'API_ERROR'
  | 'CACHE_HIT'
  | 'CACHE_MISS';

export type AuditEventInput = {
  category: AuditCategory;
  action: AuditAction;
  actor: string;
  severity?: AuditSeverity;
  symbol?: string;
  symbolType?: SymbolType;
  value?: number;
  durationMs?: number;
  meta?: Record<string, unknown>;
};

export type AuditEvent = AuditEventInput & {
  id: string;
  timestamp: string;
  severity: AuditSeverity;
};

const RING_BUFFER_SIZE = 500;
const ringBuffer: AuditEvent[] = [];
let ringHead = 0;
let ringCount = 0;

function pushToBuffer(event: AuditEvent): void {
  if (ringCount < RING_BUFFER_SIZE) {
    ringBuffer[ringHead] = event;
    ringCount++;
  } else {
    ringBuffer[ringHead] = event;
  }
  ringHead = (ringHead + 1) % RING_BUFFER_SIZE;
}

function getBufferEvents(): AuditEvent[] {
  if (ringCount < RING_BUFFER_SIZE) {
    return ringBuffer.slice(0, ringCount).reverse();
  }
  const tail = ringHead;
  const ordered = [
    ...ringBuffer.slice(tail),
    ...ringBuffer.slice(0, tail),
  ].reverse();
  return ordered;
}

export function logAuditEvent(input: AuditEventInput): void {
  const event: AuditEvent = {
    ...input,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    severity: input.severity ?? 'INFO',
  };

  pushToBuffer(event);

  logger[event.severity === 'ERROR' ? 'error' : event.severity === 'WARN' ? 'warn' : 'info'](
    { audit: true, ...event },
    `[AUDIT] ${event.category}:${event.action}`,
  );

  void prisma.auditLog
    .create({
      data: {
        category: event.category,
        action: event.action,
        actor: event.actor,
        severity: event.severity,
        symbol: event.symbol,
        symbolType: event.symbolType,
        value: event.value,
        durationMs: event.durationMs,
        meta: event.meta as Prisma.InputJsonValue | undefined,
      },
    })
    .catch((err: unknown) => {
      logger.warn({ err }, 'Failed to persist audit event to DB');
    });
}

export type AuditQueryFilters = {
  category?: AuditCategory;
  severity?: AuditSeverity;
  symbol?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export async function queryAuditEvents(
  filters: AuditQueryFilters = {},
): Promise<AuditEvent[]> {
  const limit = Math.min(filters.limit ?? 100, 500);

  const rows = await prisma.auditLog.findMany({
    where: {
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.severity ? { severity: filters.severity } : {}),
      ...(filters.symbol ? { symbol: filters.symbol } : {}),
      ...(filters.from || filters.to
        ? {
            timestamp: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });

  return rows.map((row) => ({
    id: String(row.id),
    timestamp: row.timestamp.toISOString(),
    category: row.category,
    action: row.action as AuditAction,
    actor: row.actor,
    severity: row.severity,
    symbol: row.symbol ?? undefined,
    symbolType: row.symbolType ?? undefined,
    value: row.value ? Number(row.value) : undefined,
    durationMs: row.durationMs ?? undefined,
    meta: row.meta as Record<string, unknown> | undefined,
  }));
}

export function getRecentAuditEvents(filters: AuditQueryFilters = {}): AuditEvent[] {
  let events = getBufferEvents();

  if (filters.category) {
    events = events.filter((e) => e.category === filters.category);
  }
  if (filters.severity) {
    events = events.filter((e) => e.severity === filters.severity);
  }
  if (filters.symbol) {
    events = events.filter((e) => e.symbol === filters.symbol);
  }
  if (filters.from) {
    const from = new Date(filters.from).getTime();
    events = events.filter((e) => new Date(e.timestamp).getTime() >= from);
  }
  if (filters.to) {
    const to = new Date(filters.to).getTime();
    events = events.filter((e) => new Date(e.timestamp).getTime() <= to);
  }

  return events.slice(0, Math.min(filters.limit ?? 100, 500));
}
