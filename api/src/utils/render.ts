import type { RenderData } from '@thermal-printer-fun/shared';
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
