import { DateTime } from 'luxon';
import { vi } from 'vitest';

import { seedWindow } from '@src/seed';

describe('seed window', () => {
  beforeEach(() => {
    vi.stubEnv('SEED_SESSION_DATE', '');
    vi.stubEnv('SEED_UNTIL_TIME', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to the current market minute for today when no seed until time is configured', () => {
    const { start, end } = seedWindow(
      DateTime.fromISO('2026-06-03T11:17:45', { zone: 'Asia/Dhaka' }),
    );

    expect(start.toISO()).toBe('2026-06-03T10:00:00.000+06:00');
    expect(end.toISO()).toBe('2026-06-03T11:17:00.000+06:00');
  });

  it('caps the dynamic default at market close', () => {
    const { end } = seedWindow(
      DateTime.fromISO('2026-06-03T16:00:00', { zone: 'Asia/Dhaka' }),
    );

    expect(end.toISO()).toBe('2026-06-03T14:30:00.000+06:00');
  });

  it('keeps explicit SEED_UNTIL_TIME as the configured demo cutoff', () => {
    const { end } = seedWindow(
      DateTime.fromISO('2026-06-03T13:00:00', { zone: 'Asia/Dhaka' }),
      { untilTime: '11:30' },
    );

    expect(end.toISO()).toBe('2026-06-03T11:30:00.000+06:00');
  });

  it('seeds a configured historical date through the full session by default', () => {
    const { start, end } = seedWindow(
      DateTime.fromISO('2026-06-03T11:00:00', { zone: 'Asia/Dhaka' }),
      { sessionDate: '2026-06-02' },
    );

    expect(start.toISO()).toBe('2026-06-02T10:00:00.000+06:00');
    expect(end.toISO()).toBe('2026-06-02T14:30:00.000+06:00');
  });
});
