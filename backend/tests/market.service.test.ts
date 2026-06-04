import { DateTime } from 'luxon';

import { getMarketStatus, isMarketOpen } from '@src/modules/market/market.service';

describe('market status service', () => {
  it('returns open during configured market hours', () => {
    const status = getMarketStatus(
      DateTime.fromISO('2026-06-03T11:00:00', {
        zone: 'Asia/Dhaka',
      }).toUTC(),
    );

    expect(status.isOpen).toBe(true);
    expect(status.message).toBeUndefined();
  });

  it('returns closed before market open', () => {
    const status = getMarketStatus(
      DateTime.fromISO('2026-06-03T09:59:00', {
        zone: 'Asia/Dhaka',
      }).toUTC(),
    );

    expect(status.isOpen).toBe(false);
    expect(status.message).toBe('Market is currently closed.');
  });

  it('returns closed at market close time (exclusive)', () => {
    const status = getMarketStatus(
      DateTime.fromISO('2026-06-03T14:30:00', {
        zone: 'Asia/Dhaka',
      }).toUTC(),
    );

    expect(status.isOpen).toBe(false);
  });

  it('returns closed after market close', () => {
    const status = getMarketStatus(
      DateTime.fromISO('2026-06-03T15:00:00', {
        zone: 'Asia/Dhaka',
      }).toUTC(),
    );

    expect(status.isOpen).toBe(false);
  });

  it('returns open at exact market open time', () => {
    const status = getMarketStatus(
      DateTime.fromISO('2026-06-03T10:00:00', {
        zone: 'Asia/Dhaka',
      }).toUTC(),
    );

    expect(status.isOpen).toBe(true);
  });

  it('returns open one minute before close', () => {
    const status = getMarketStatus(
      DateTime.fromISO('2026-06-03T14:29:00', {
        zone: 'Asia/Dhaka',
      }).toUTC(),
    );

    expect(status.isOpen).toBe(true);
  });

  it('includes timezone in response', () => {
    const status = getMarketStatus(
      DateTime.fromISO('2026-06-03T11:00:00', {
        zone: 'Asia/Dhaka',
      }).toUTC(),
    );

    expect(status.timezone).toBe('Asia/Dhaka');
    expect(status.marketOpenTime).toBe('10:00');
    expect(status.marketCloseTime).toBe('14:30');
  });

  it('isMarketOpen helper agrees with getMarketStatus', () => {
    const midday = DateTime.fromISO('2026-06-03T12:00:00', {
      zone: 'Asia/Dhaka',
    }).toUTC();
    const midnight = DateTime.fromISO('2026-06-03T01:00:00', {
      zone: 'Asia/Dhaka',
    }).toUTC();

    expect(isMarketOpen(midday)).toBe(true);
    expect(isMarketOpen(midnight)).toBe(false);
  });
});
