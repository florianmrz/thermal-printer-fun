import type { PrinterStatus } from '@thermal-printer-fun/shared';

/**
 * Poll interval handed to the printer client while nobody is using the web app. This doubles as the
 * worst case time until the printer notices that somebody showed up.
 */
const POLL_INTERVAL_IDLE_MS = 20_000;

/**
 * Poll interval while somebody has the web app open, so a print triggered by them starts quickly.
 */
const POLL_INTERVAL_ACTIVE_MS = 2_000;

/**
 * Poll interval while jobs are waiting to be picked up, to drain the queue without idling in between.
 */
const POLL_INTERVAL_BUSY_MS = 1_000;

/**
 * How long the web app is considered "in use" after its last poll. Generously larger than the web
 * app's own poll interval so a few dropped requests do not slow the printer back down.
 */
const WEB_ACTIVE_WINDOW_MS = 60_000;

/**
 * Extra slack on top of the interval the printer was told to use before declaring it offline. The
 * printer client cannot poll while it is busy pushing a job to the printer, so this has to tolerate
 * a few missed polls. The status does not need to be exact.
 */
const POLL_GRACE_FACTOR = 3;
const POLL_GRACE_EXTRA_MS = 10_000;

let lastPrinterPollAt = 0;
let lastAdvertisedIntervalMs = POLL_INTERVAL_IDLE_MS;
let printerUsbReady = false;
let lastWebActivityAt = 0;
let lastLoggedStatus: PrinterStatus = 'unknown';

/**
 * Records that the printer client polled. `usbReady` reports whether the thermal printer itself is
 * attached to the client over USB.
 */
export function recordPrinterPoll(poll: { intervalMs: number; usbReady: boolean; rssi?: number; freeHeap?: number }) {
  lastPrinterPollAt = Date.now();
  lastAdvertisedIntervalMs = poll.intervalMs;
  printerUsbReady = poll.usbReady;

  const status = getPrinterStatus();
  if (status !== lastLoggedStatus) {
    lastLoggedStatus = status;
    console.log(
      `Printer is now ${status} (usbReady=${poll.usbReady}, rssi=${poll.rssi ?? 'n/a'}, freeHeap=${poll.freeHeap ?? 'n/a'})`
    );
  }
}

/**
 * Records that a web client is currently looking at the app, which ramps up the printer poll rate.
 */
export function recordWebActivity() {
  lastWebActivityAt = Date.now();
}

/**
 * Derives the printer status from whether the client polled within the interval it was told to use.
 */
export function getPrinterStatus(): PrinterStatus {
  if (lastPrinterPollAt === 0) {
    return 'unknown';
  }

  const graceMs = lastAdvertisedIntervalMs * POLL_GRACE_FACTOR + POLL_GRACE_EXTRA_MS;
  if (Date.now() - lastPrinterPollAt > graceMs) {
    return 'disconnected';
  }

  // The client is reachable, but without the thermal printer attached it still cannot print.
  return printerUsbReady ? 'connected' : 'disconnected';
}

/**
 * The interval the printer client should use until its next poll.
 */
export function getPrinterPollIntervalMs(hasJobsWaiting: boolean) {
  if (hasJobsWaiting) {
    return POLL_INTERVAL_BUSY_MS;
  }

  if (Date.now() - lastWebActivityAt < WEB_ACTIVE_WINDOW_MS) {
    return POLL_INTERVAL_ACTIVE_MS;
  }

  return POLL_INTERVAL_IDLE_MS;
}
