import request from 'supertest';
import { vi } from 'vitest';

type ErrorResponse = {
  error: string;
};

type ApiAuditEvent = {
  action: string;
  category: string;
  meta?: {
    error?: {
      message?: string;
      name: string;
      statusCode: number;
    };
    method?: string;
    path?: string;
    requestId?: string;
    statusCode?: number;
  };
  severity: string;
};

const auditMocks = vi.hoisted(() => ({
  logAuditEvent: vi.fn(),
  queryAuditEvents: vi.fn(),
}));

vi.mock('@src/modules/audit/audit.service', () => ({
  logAuditEvent: auditMocks.logAuditEvent,
  queryAuditEvents: auditMocks.queryAuditEvents,
}));

import { createApp } from '@src/server';

describe('audit routes', () => {
  beforeEach(() => {
    auditMocks.logAuditEvent.mockClear();
    auditMocks.queryAuditEvents.mockReset();
    auditMocks.queryAuditEvents.mockResolvedValue([]);
  });

  it('returns 400 for invalid audit query filters', async () => {
    const app = createApp();

    const response = await request(app)
      .get('/api/audit/events?category=BAD')
      .expect(400);
    const body = response.body as ErrorResponse;

    expect(body.error).toContain('category must be one of');

    expect(auditMocks.queryAuditEvents).not.toHaveBeenCalled();
  });

  it('passes normalized audit query filters to the audit service', async () => {
    const app = createApp();

    await request(app)
      .get(
        '/api/audit/events?category=API&severity=ERROR&symbol=DSEX&from=2026-06-05T00:00:00.000Z&to=2026-06-05T01:00:00.000Z&limit=3',
      )
      .expect(200)
      .expect({ events: [], count: 0 });

    expect(auditMocks.queryAuditEvents).toHaveBeenCalledWith({
      category: 'API',
      severity: 'ERROR',
      symbol: 'DSEX',
      from: '2026-06-05T00:00:00.000Z',
      to: '2026-06-05T01:00:00.000Z',
      limit: 3,
    });
  });

  it('adds sanitized error details to API error audit events', async () => {
    const app = createApp();

    await request(app)
      .get('/api/audit/events?limit=0')
      .expect(400);

    const calls = auditMocks.logAuditEvent.mock.calls as Array<[ApiAuditEvent]>;
    const apiErrorEvent = calls.find(([event]) => event.action === 'API_ERROR')?.[0];

    expect(apiErrorEvent).toBeDefined();
    expect(apiErrorEvent?.category).toBe('API');
    expect(apiErrorEvent?.severity).toBe('WARN');
    expect(apiErrorEvent?.meta?.error).toEqual({
      message: 'limit must be an integer from 1 to 500.',
      name: 'Error',
      statusCode: 400,
    });
    expect(apiErrorEvent?.meta?.method).toBe('GET');
    expect(apiErrorEvent?.meta?.path).toBe('/api/audit/events');
    expect(apiErrorEvent?.meta?.requestId).toEqual(expect.any(String));
    expect(apiErrorEvent?.meta?.statusCode).toBe(400);
  });
});
