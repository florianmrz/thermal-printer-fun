import PQueue from 'p-queue';
import { broadcastPrinterQueue, getPrinterClient } from './ws.js';
import { nanoid } from 'nanoid';
import type { PrinterStatus } from '@thermal-printer-fun/shared';
import { env } from '../env.js';

const queue = new PQueue({ concurrency: 1, timeout: 30_000 });
const queueJobIds = new Set<string>();

export function getPrinterQueueJobIds() {
  return Array.from(queueJobIds);
}

export function setPrinterStatus(status: PrinterStatus) {
  if (status === 'connected') {
    // If the printer was just connected, restart the queue to process any pending jobs
    queue.start();
  }
}

/**
 * Submits a print job to the printer queue. The job will be executed in order, and the printer will process one job at a time.
 *
 * @returns The ID of the print job
 */
export function print(
  /**
   * The print lines to send to the printer. Each line should be a Uint8Array of raster data representing a single line of the printout.
   * Can be as-is or a function that returns the data (or a promise that resolves to the data) to allow for lazy evaluation of the print data when the job is executed.
   */
  printData: Uint8Array<ArrayBuffer>[] | (() => Promise<Uint8Array<ArrayBuffer>[]> | Uint8Array<ArrayBuffer>[]),
  options?: {
    /**
     * Whether to cut the paper after printing.
     * If set to false, the printer will not cut the paper, allowing for continuous printing.
     *
     * @default true
     */
    cutPaper?: boolean;
    /**
     * The print quality.
     *
     * @default 'highPrint'
     */
    printQuality?: 'highSpeed' | 'normal' | 'highPrint';
    /**
     * The number of dots to feed after printing.
     *
     * @default 0
     */
    lineFeedDots?: number;
  }
) {
  async function submitPrint() {
    const printLines = await Promise.resolve(typeof printData === 'function' ? printData() : printData);

    // Reset printer and initialize raster mode
    // ESC * r A
    await sendToPrinter(Uint8Array.from([0x1b, 0x2a, 0x72, 0x41]));

    // Set raster page length to continous mode
    // ESC * r P n NUL (n = page length, 0 for continous print)
    await sendToPrinter(Uint8Array.from([0x1b, 0x2a, 0x72, 0x50, 0x00, 0x00]));

    // Set raster print quality
    // ESC * r Q n NUL (n = print quality: 0 = high speed, 1 = normal 2 = high print)
    const printQuality = options?.printQuality ?? 'highPrint';
    const printQualityMap = {
      highSpeed: 0x30, // 0
      normal: 0x31, // 1
      highPrint: 0x32, // 2
    };
    await sendToPrinter(Uint8Array.from([0x1b, 0x2a, 0x72, 0x51, printQualityMap[printQuality], 0x00]));

    // Set raster FF mode
    // ESC * r F n NUL (n = mode: 0 = allows paper cut, 1 = prevents paper cut)
    const cutPaper = options?.cutPaper ?? true;
    await sendToPrinter(Uint8Array.from([0x1b, 0x2a, 0x72, 0x46, cutPaper ? 0x30 : 0x31, 0x00]));

    // Send raster data (auto line feed)
    // b H 00 + 72 bytes of data
    let linesInChunk = 0;
    const lineChunks: Uint8Array[] = [];
    let currentChunk: Uint8Array = new Uint8Array();
    const linesToPrint = env.PRINT_UPSIDE_DOWN ? [...printLines].reverse() : printLines;
    linesToPrint.forEach(line => {
      const lineHeader = Uint8Array.from([0x62, 0x48, 0x00]);
      const lineToPrint = env.PRINT_UPSIDE_DOWN
        ? Uint8Array.from([...line].reverse().map(byte => reverseByteBits(byte)))
        : line;
      const linePacket = new Uint8Array([...lineHeader, ...lineToPrint]);
      currentChunk = new Uint8Array([...currentChunk, ...linePacket]);
      linesInChunk++;
      if (linesInChunk >= 100) {
        lineChunks.push(currentChunk);
        currentChunk = new Uint8Array();
        linesInChunk = 0;
      }
    });
    if (currentChunk.length > 0) {
      lineChunks.push(currentChunk);
    }
    for (const chunk of lineChunks) {
      await sendToPrinter(chunk);
    }

    // Move vertical direction position by 100 dots
    // ESC * r Y n NUL (n = number of dots to move)
    if (options?.lineFeedDots && typeof options.lineFeedDots === 'number' && options.lineFeedDots > 0) {
      const lineFeedAsHex = Array.from(options.lineFeedDots.toString()).map(c => c.charCodeAt(0));
      await sendToPrinter(Uint8Array.from([0x1b, 0x2a, 0x72, 0x59, ...lineFeedAsHex, 0x00]));
    }

    // Execute FF mode (cuts paper)
    // ESC FF NUL
    await sendToPrinter(Uint8Array.from([0x1b, 0x0c, 0x00]));
  }

  const jobId = nanoid();
  queueJobIds.add(jobId);
  broadcastPrinterQueue();

  // Add job to queue and catch any errors
  void queue.add(
    async () => {
      try {
        await submitPrint();
      } catch (error) {
        if (error instanceof PrinterOfflineError) {
          // This is the only expected error; simply pause the queue until the printer is back online.
          console.error('Printer is offline, pausing queue...');
          queue.pause();
        } else {
          // Something else went wrong; log the error but keep the queue running.
          console.error('An error occurred while printing:', error);
        }
      } finally {
        queueJobIds.delete(jobId);
        broadcastPrinterQueue();
      }
    },
    {
      id: jobId,
    }
  );

  return { jobId };
}

/**
 * Reverses the bits of a byte.
 */
function reverseByteBits(byte: number) {
  let reversed = 0;
  for (let bit = 0; bit < 8; bit++) {
    reversed = (reversed << 1) | ((byte >> bit) & 1);
  }
  return reversed;
}

async function sendToPrinter(data: Uint8Array) {
  const client = getPrinterClient();
  if (!client) {
    throw new PrinterOfflineError();
  }
  await new Promise<void>((resolve, reject) => {
    client.send(data, error => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

class PrinterOfflineError extends Error {
  readonly name: 'PrinterOfflineError';
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'PrinterOfflineError';
  }
}
