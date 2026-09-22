import PQueue from 'p-queue';
import { nanoid } from 'nanoid';
import { env } from '../env.js';

/**
 * How long a rendered job waits for the printer to pick it up before it is discarded. Nobody wants a
 * receipt they requested half an hour ago to show up once the printer comes back online.
 */
const JOB_TTL_MS = 5 * 60 * 1000;

/**
 * Upper bound of jobs kept around for pickup, so an offline printer cannot grow the heap unbounded.
 */
const MAX_READY_JOBS = 10;

/**
 * Rendering is serialized (puppeteer and sharp are heavy) which also keeps jobs in submission order.
 */
const renderQueue = new PQueue({ concurrency: 1, timeout: 60_000 });

/**
 * IDs of all jobs that have been submitted but not printed yet, either still rendering or waiting for
 * the printer to pick them up. Used to show the queue in the web app.
 */
const queueJobIds = new Set<string>();

interface ReadyJob {
  id: string;
  /** The complete byte stream to send to the printer, including init commands and the final cut. */
  data: Uint8Array<ArrayBuffer>;
  readyAt: number;
}

const readyJobs: ReadyJob[] = [];

export function getPrinterQueueJobIds() {
  return Array.from(queueJobIds);
}

/**
 * Submits a print job to the printer queue. The job is rendered right away and then waits for the
 * printer client to pick it up on its next poll. Jobs are handed out in submission order.
 *
 * @returns The ID of the print job
 */
export function print(
  /**
   * The print lines to send to the printer. Each line should be a Uint8Array of raster data representing a single line of the printout.
   * Can be as-is or a function that returns the data (or a promise that resolves to the data) to allow for lazy evaluation of the print data when the job is rendered.
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
  const jobId = nanoid(8);
  queueJobIds.add(jobId);

  void renderQueue.add(
    async () => {
      try {
        const printLines = await Promise.resolve(typeof printData === 'function' ? printData() : printData);
        const data = buildPrintPayload(printLines, options);

        pruneReadyJobs();
        readyJobs.push({ id: jobId, data, readyAt: Date.now() });

        while (readyJobs.length > MAX_READY_JOBS) {
          const dropped = readyJobs.shift();
          if (dropped) {
            console.error(`Print queue is full, dropping job ${dropped.id}.`);
            queueJobIds.delete(dropped.id);
          }
        }
      } catch (error) {
        console.error('An error occurred while rendering a print job:', error);
        queueJobIds.delete(jobId);
      }
    },
    { id: jobId }
  );

  return { jobId };
}

/**
 * Hands the oldest ready job to the printer client. Delivery is at-most-once: once a job has been
 * handed out it is gone, a print lost to a dropping connection is not retried.
 */
export function claimNextJob(): ReadyJob | null {
  pruneReadyJobs();

  const job = readyJobs.shift();
  if (!job) {
    return null;
  }

  queueJobIds.delete(job.id);
  return job;
}

export function hasJobsWaiting() {
  pruneReadyJobs();
  return readyJobs.length > 0;
}

function pruneReadyJobs() {
  const now = Date.now();
  for (let index = readyJobs.length - 1; index >= 0; index--) {
    const job = readyJobs[index];
    if (now - job.readyAt > JOB_TTL_MS) {
      console.log(`Print job ${job.id} expired before it was picked up.`);
      readyJobs.splice(index, 1);
      queueJobIds.delete(job.id);
    }
  }
}

/**
 * Builds the complete byte stream for a print job, ready to be sent to the printer as-is.
 */
function buildPrintPayload(
  printLines: Uint8Array<ArrayBuffer>[],
  options?: Parameters<typeof print>[1]
): Uint8Array<ArrayBuffer> {
  const parts: Uint8Array[] = [];

  // Reset printer and initialize raster mode
  // ESC * r A
  parts.push(Uint8Array.from([0x1b, 0x2a, 0x72, 0x41]));

  // Set raster page length to continous mode
  // ESC * r P n NUL (n = page length, 0 for continous print)
  parts.push(Uint8Array.from([0x1b, 0x2a, 0x72, 0x50, 0x00, 0x00]));

  // Set raster print quality
  // ESC * r Q n NUL (n = print quality: 0 = high speed, 1 = normal 2 = high print)
  const printQuality = options?.printQuality ?? 'highPrint';
  const printQualityMap = {
    highSpeed: 0x30, // 0
    normal: 0x31, // 1
    highPrint: 0x32, // 2
  };
  parts.push(Uint8Array.from([0x1b, 0x2a, 0x72, 0x51, printQualityMap[printQuality], 0x00]));

  // Set raster FF mode
  // ESC * r F n NUL (n = mode: 0 = allows paper cut, 1 = prevents paper cut)
  const cutPaper = options?.cutPaper ?? true;
  parts.push(Uint8Array.from([0x1b, 0x2a, 0x72, 0x46, cutPaper ? 0x30 : 0x31, 0x00]));

  // Send raster data (auto line feed)
  // b H 00 + 72 bytes of data
  const linesToPrint = env.PRINT_UPSIDE_DOWN ? [...printLines].reverse() : printLines;
  linesToPrint.forEach(line => {
    const lineHeader = Uint8Array.from([0x62, 0x48, 0x00]);
    const lineToPrint = env.PRINT_UPSIDE_DOWN
      ? Uint8Array.from([...line].reverse().map(byte => reverseByteBits(byte)))
      : line;
    parts.push(new Uint8Array([...lineHeader, ...lineToPrint]));
  });

  // Move vertical direction position by n dots
  // ESC * r Y n NUL (n = number of dots to move)
  if (options?.lineFeedDots && typeof options.lineFeedDots === 'number' && options.lineFeedDots > 0) {
    const lineFeedAsHex = Array.from(options.lineFeedDots.toString()).map(c => c.charCodeAt(0));
    parts.push(Uint8Array.from([0x1b, 0x2a, 0x72, 0x59, ...lineFeedAsHex, 0x00]));
  }

  // Execute FF mode (cuts paper)
  // ESC FF NUL
  parts.push(Uint8Array.from([0x1b, 0x0c, 0x00]));

  const totalLength = parts.reduce((length, part) => length + part.byteLength, 0);
  const payload = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    payload.set(part, offset);
    offset += part.byteLength;
  }

  return payload;
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
