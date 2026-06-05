import { DateTime } from 'luxon';

import { logger } from '@src/config/logger';
import { logAuditEvent } from '@src/modules/audit/audit.service';
import { isMarketOpen } from '@src/modules/market/market.service';
import { emitMarketClosed } from '@src/modules/realtime/socket.server';
import { getMarketSession, toIso } from '@src/utils/time';

/**
 * Server-side market clock.
 *
 * Emits `market:closed` to all connected clients on the open -> closed
 * transition. This is intentionally independent of the simulator so that the
 * "live updates stop / closed state shown when the market closes" requirement
 * holds even when SIMULATOR_ENABLED=false.
 */
const CHECK_INTERVAL_MS = 1_000;

let timer: NodeJS.Timeout | undefined;
let lastOpen: boolean | undefined;

function check(): void {
  const open = isMarketOpen();

  // First observation just records baseline state; no transition to report.
  if (lastOpen === undefined) {
    lastOpen = open;
    return;
  }

  if (!lastOpen && open) {
    logAuditEvent({
      category: 'SESSION',
      action: 'MARKET_OPEN',
      actor: 'market.clock',
      severity: 'INFO',
      meta: { sessionStart: toIso(getMarketSession(DateTime.utc()).sessionStart) },
    });
    logger.info('Market opened');
  }

  if (lastOpen && !open) {
    const session = getMarketSession(DateTime.utc());
    emitMarketClosed({
      message: 'Market is now closed.',
      closedAt: toIso(session.sessionEnd),
    });
    logAuditEvent({
      category: 'SESSION',
      action: 'MARKET_CLOSED',
      actor: 'market.clock',
      severity: 'INFO',
      meta: { closedAt: toIso(session.sessionEnd) },
    });
    logger.info('Market closed — emitted market:closed to clients');
  }

  lastOpen = open;
}

export function startMarketClock(): void {
  if (timer) {
    return;
  }
  lastOpen = isMarketOpen();
  timer = setInterval(check, CHECK_INTERVAL_MS);
  // Do not keep the process alive solely for this heartbeat.
  timer.unref?.();
}

export function stopMarketClock(): void {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
  lastOpen = undefined;
}
