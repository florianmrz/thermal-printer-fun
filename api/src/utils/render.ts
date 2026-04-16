import type { RenderData } from '@thermal-printer-fun/shared';
import { promises as dns } from 'node:dns';
import { writeFileSync } from 'node:fs';
import type { Browser } from 'puppeteer';
import puppeteer from 'puppeteer';
import { env } from '../env.js';

const RENDER_VIEWPORT_WIDTH = 576;
const NAVIGATION_TIMEOUT_MS = 10_000;
const READY_TIMEOUT_MS = 10_000;

let browserPromise: Promise<Browser> | null = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({ headless: env.ENV === 'development' ? false : true });
    const browser = await browserPromise;
    browser.on('disconnected', () => {
      browserPromise = null;
    });
    return browser;
  }

  return browserPromise;
}

type PuppeteerWindow = Window & {
  __RENDER_DATA__?: RenderData;
  __RENDER_READY__?: boolean;
};

export async function renderToPng(data: RenderData): Promise<Uint8Array<ArrayBuffer>> {
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

    if (env.ENV === 'development') {
      /**
       * During development, the Vue Devtools might be visible in the rendered app.
       * We remove it by simply deleting the element from the page.
       */
      await page.waitForSelector('#__vue-devtools-container__', { timeout: 1_000 });
      await page.evaluate(() => document.getElementById('__vue-devtools-container__')?.remove());
    }

    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: true,
    });

    if (env.ENV === 'development') {
      writeFileSync('last-screenshot.png', screenshot);
    }

    return new Uint8Array(screenshot);
  } finally {
    await page.close();
  }
}

const MAX_WEBSITE_HEIGHT_PX = 5000;
const WEBSITE_VIEWPORT_HEIGHT_PX = 800;

function isPrivateIp(ip: string): boolean {
  const privatePatterns = [/^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^169\.254\./, /^0\./];
  if (privatePatterns.some(p => p.test(ip))) return true;
  if (ip === '::1' || /^f[cd]/i.test(ip)) return true;
  return false;
}

export async function renderWebsiteToPng(url: string, fullPage: boolean): Promise<Uint8Array<ArrayBuffer>> {
  const parsed = new URL(url);

  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed');
  }

  const { address } = await dns.lookup(parsed.hostname);
  if (isPrivateIp(address)) {
    throw new Error('URL resolves to a private or loopback address');
  }

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: RENDER_VIEWPORT_WIDTH, height: WEBSITE_VIEWPORT_HEIGHT_PX, deviceScaleFactor: 1 });
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: NAVIGATION_TIMEOUT_MS,
    });

    let screenshot: Uint8Array<ArrayBufferLike> | null = null;

    if (fullPage) {
      const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      const height = Math.min(scrollHeight, MAX_WEBSITE_HEIGHT_PX);
      screenshot = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: RENDER_VIEWPORT_WIDTH, height },
      });
    } else {
      screenshot = await page.screenshot({ type: 'png', fullPage: false });
    }

    if (env.ENV === 'development') {
      writeFileSync('last-website-screenshot.png', screenshot);
    }

    return new Uint8Array(screenshot);
  } finally {
    await page.close();
  }
}
