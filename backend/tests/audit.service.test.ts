import { Prisma } from '@prisma/client';
import { vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({
  auditLog: {
    create: vi.fn().mockResolvedValue({}),
    findMany: vi.fn(),
  },
}));

vi.mock('@src/db/prisma', () => ({
  prisma: {
    auditLog: prismaMocks.auditLog,
  },
}));

import { queryAuditEvents } from '@src/modules/audit/audit.service';

describe('audit service', () => {
  beforeEach(() => {
    prismaMocks.auditLog.findMany.mockReset();
  });

  it('preserves zero numeric values in audit responses', async () => {
    prismaMocks.auditLog.findMany.mockResolvedValue([
      {
        id: BigInt(1),
        timestamp: new Date('2026-06-05T12:00:00.000Z'),
        category: 'MARKET_DATA',
        action: 'TICK_PERSISTED',
        actor: 'test',
        severity: 'INFO',
        symbol: 'DSEX',
        symbolType: 'INDEX',
        value: new Prisma.Decimal(0),
        durationMs: 0,
        meta: null,
      },
    ]);

    const events = await queryAuditEvents();

    expect(events[0]).toMatchObject({
      id: '1',
      value: 0,
      durationMs: 0,
      meta: undefined,
    });
  });
});
