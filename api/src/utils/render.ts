import type { Browser } from 'puppeteer';
import puppeteer from 'puppeteer';
import PQueue from 'p-queue';
import type { RenderData } from '@thermal-printer-fun/shared';
import { env } from '../env.js';

const RENDER_VIEWPORT_WIDTH = 576;
const NAVIGATION_TIMEOUT_MS = 10_000;
const READY_TIMEOUT_MS = 10_000;
const TOTAL_RENDER_TIMEOUT_MS = 20_000;

const renderQueue = new PQueue({ concurrency: 2 });

let browserPromise: Promise<Browser> | null = null;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Job timed out'));
    }, TOTAL_RENDER_TIMEOUT_MS);

    promise
      .then(value => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch(error => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({ headless: true });
    const browser = await browserPromise;
    browser.on('disconnected', () => {
      browserPromise = null;
    });
    return browser;
  }

  return browserPromise;
}

type PuppeteerWindow = {
  __RENDER_DATA__?: RenderData;
  __RENDER_READY__?: boolean;
};

async function renderPngInternal(data: RenderData): Promise<Uint8Array<ArrayBuffer>> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: RENDER_VIEWPORT_WIDTH, height: 100, deviceScaleFactor: 1 });
    await page.evaluateOnNewDocument((renderData: RenderData) => {
      (window as PuppeteerWindow).__RENDER_DATA__ = renderData;
    }, data);

    const renderUrl = new URL('/render.html', env.RENDER_BASE_URL).toString();
    await page.goto(renderUrl, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT_MS,
    });

    await page.waitForFunction(() => (window as PuppeteerWindow).__RENDER_READY__ === true, {
      timeout: READY_TIMEOUT_MS,
    });

    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: true,
    });

    return new Uint8Array(screenshot);
  } finally {
    await page.close();
  }
}

export async function renderToPng(data: RenderData) {
  return renderQueue.add(() => withTimeout(renderPngInternal(data)));
}
