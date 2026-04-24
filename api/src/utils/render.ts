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
  if (privatePatterns.some(p => p.test(ip)) || ip === '::1' || /^f[cd]/i.test(ip)) {
    return true;
  }
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

    // Remove any cookie banner scripts that might interfere with the screenshot
    await Promise.all(removeCookieBannerScripts.map(script => page.evaluate(script)));

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
      writeFileSync('last-screenshot.png', screenshot);
    }

    return new Uint8Array(screenshot);
  } finally {
    await page.close();
  }
}

const removeCookieBannerScripts: (() => Promise<void>)[] = [
  // Cookiebot
  async () => {
    document.getElementById('CybotCookiebotDialog')?.remove();
    document.getElementById('CybotCookiebotDialogBodyUnderlay')?.remove();
    document.querySelector('.cookiebot-overlay')?.remove();
  },

  // OneTrust / OptanonConsent
  async () => {
    document.getElementById('onetrust-consent-sdk')?.remove();
    document.getElementById('onetrust-banner-sdk')?.remove();
    document.querySelector('.onetrust-pc-dark-filter')?.remove();
    document.querySelector('#optanon')?.remove();
  },

  // TrustArc / TrustE
  async () => {
    document.getElementById('truste-consent-track')?.remove();
    document.querySelector('.truste_overlay')?.remove();
    document.querySelector('.truste_box_overlay')?.remove();
    document.getElementById('teconsent')?.remove();
  },

  // Quantcast Choice
  async () => {
    document.querySelector('.qc-cmp2-container')?.remove();
    document.querySelector('.qc-cmp-ui')?.remove();
    document.querySelector('#qc-cmp2-container')?.remove();
  },

  // Didomi
  async () => {
    document.getElementById('didomi-host')?.remove();
    document.querySelector('.didomi-popup-backdrop')?.remove();
  },

  // Osano
  async () => {
    document.querySelector('.osano-cm-window')?.remove();
    document.querySelector('.osano-cm-dialog')?.remove();
  },

  // Usercentrics
  async () => {
    document.getElementById('usercentrics-root')?.remove();
    document.querySelector('uc-ui-cmp-ui')?.remove();
  },

  // Cookiefirst
  async () => {
    document.getElementById('cookiefirst-root')?.remove();
    document.querySelector('[data-cookiefirst-widget]')?.remove();
  },

  // cookie-script.com
  async () => {
    document.getElementById('cookie-script-com')?.remove();
  },

  // Borlabs Cookie
  async () => {
    document.getElementById('BorlabsCookieBox')?.remove();
  },

  // Cookie Notice (WordPress plugin)
  async () => {
    document.getElementById('cookie-notice-wrapper')?.remove();
    document.querySelector('.cookie-notice-container')?.remove();
  },

  // GDPR Cookie Consent (WordPress plugin)
  async () => {
    document.getElementById('gdpr-cookie-consent-bar')?.remove();
    document.querySelector('.cli-bar-container')?.remove();
  },

  // CookieYes / Cookie Law Info
  async () => {
    document.querySelector('.cky-consent-container')?.remove();
    document.querySelector('.cky-overlay')?.remove();
    document.querySelector('#cky-consent')?.remove();
    document.querySelector('.cli_messagebar')?.remove();
  },

  // HubSpot cookie banner
  async () => {
    document.querySelector('#hs-eu-cookie-confirmation')?.remove();
    document.querySelector('#hs-eu-policy-wording')?.remove();
  },

  // Consent Manager (Sourcepoint)
  async () => {
    document.querySelector('#sp_message_container')?.remove();
    document.querySelector('.sp-message-container')?.remove();
    document.querySelector('div[data-id="sp_privacy_manager_container"]')?.remove();
  },

  // Iubenda
  async () => {
    document.querySelector('#iubenda-cs-banner')?.remove();
    document.querySelector('.iubenda-cs-container')?.remove();
  },

  // Complianz
  async () => {
    document.querySelector('.cmplz-cookiebanner')?.remove();
    document.querySelector('.cmplz-overlay')?.remove();
  },

  // Termly
  async () => {
    document.querySelector('#termly-code-snippet-support')?.remove();
    document.querySelector('[data-tid="banner-overlay"]')?.remove();
  },

  // Admiral
  async () => {
    document.querySelector('#admiral-consent')?.remove();
  },

  // Generic common selectors
  async () => {
    const genericSelectors = [
      '[id*="cookie-banner"]',
      '[id*="cookie-consent"]',
      '[id*="cookie-notice"]',
      '[id*="cookie-bar"]',
      '[id*="cookie-overlay"]',
      '[class*="cookie-banner"]',
      '[class*="cookie-consent"]',
      '[class*="cookie-notice"]',
      '[class*="cookie-bar"]',
      '[class*="gdpr-banner"]',
      '[class*="consent-banner"]',
      '[class*="consent-overlay"]',
      '[aria-label*="cookie" i]',
      '[aria-label*="consent" i]',
    ];
    for (const selector of genericSelectors) {
      document.querySelectorAll(selector).forEach(el => el.remove());
    }
  },

  // Remove body/html overflow:hidden that cookie overlays often add
  async () => {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.documentElement.style.overflow = '';
  },
];
