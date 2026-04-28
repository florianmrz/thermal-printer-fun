import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import type { RenderDataFakeReceipt } from '@thermal-printer-fun/shared';
import { generateText, Output } from 'ai';
import Replicate, { type FileOutput } from 'replicate';
import { z } from 'zod';
import { env } from '../env.js';

const DEFAULT_LOCALE = 'de-DE';
const DEFAULT_CURRENCY = 'EUR';
const DEFAULT_TAX_RATE_BPS = 1900;

const ALLOWED_LOCALES = new Set(['de-DE', 'en-US', 'en-GB', 'fr-FR', 'es-ES', 'it-IT', 'ja-JP', 'zh-CN']);

const ALLOWED_CURRENCIES = new Set(['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'SEK', 'NOK', 'DKK']);

const aiReceiptSchema = z.object({
  storeName: z.string().describe('Name of the store or business'),
  storeAddress: z.string().describe('Store address, one line'),
  cashierName: z.string().describe('First name of the cashier'),
  paymentMethod: z.string().describe('Payment method, e.g. Cash, Visa, Mastercard'),
  items: z
    .array(
      z.object({
        name: z.string().describe('Product or service name'),
        quantity: z.number().int().positive().describe('Number of units purchased'),
        unitPriceCents: z.number().int().nonnegative().describe('Unit price in minor currency units (e.g. cents)'),
      })
    )
    .min(6)
    .max(10)
    .describe('Between 6 and 10 purchased items'),
  taxRateBps: z
    .number()
    .int()
    .nonnegative()
    .describe('Tax rate in basis points (e.g. 1900 = 19%, 1000 = 10%). Pick a rate appropriate for the chosen locale.'),
  locale: z
    .enum([...ALLOWED_LOCALES])
    .default(DEFAULT_LOCALE)
    .nullable()
    .describe('BCP 47 locale tag appropriate for the topic and store, e.g. de-DE or en-US. Null to use default.'),
  currency: z
    .enum([...ALLOWED_CURRENCIES])
    .default(DEFAULT_CURRENCY)
    .nullable()
    .describe('ISO 4217 currency code appropriate for the locale, e.g. EUR or USD. Null to use default.'),
  dateTime: z
    .string()
    .nullable()
    .describe(
      'ISO 8601 datetime string for the receipt, e.g. 2024-06-15T14:32:00. Should be realistic for the context. Null to use server time.'
    ),
  footerMessage: z
    .string()
    .describe(
      'A short closing message printed at the bottom of the receipt. Can be humorous or fitting for the topic.'
    ),
});

function normalizeItems(items: z.infer<typeof aiReceiptSchema>['items']): RenderDataFakeReceipt['items'] {
  return items.map(item => ({
    name: item.name,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    lineTotalCents: item.quantity * item.unitPriceCents,
  }));
}

function recomputeTotals(
  items: RenderDataFakeReceipt['items'],
  taxRateBps: number
): { subtotalCents: number; taxCents: number; totalCents: number; taxRateBps: number } {
  const effectiveTaxRateBps = taxRateBps >= 0 && taxRateBps <= 50_000 ? taxRateBps : DEFAULT_TAX_RATE_BPS;
  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  const taxCents = Math.round((subtotalCents * effectiveTaxRateBps) / 10_000);
  const totalCents = subtotalCents + taxCents;
  return { subtotalCents, taxCents, totalCents, taxRateBps: effectiveTaxRateBps };
}

async function generateReceiptContent(topic: string) {
  const prompt = `You are generating the contents of a fake, fictional receipt for a store that sells things related to the topic: "${topic}".

The receipt should look mostly realistic but with some fun or fitting details. Make the store name, products, cashier, and footer reflect the theme of the topic.

Generate prices in the minor currency units (cents for EUR/USD, yen for JPY, etc.) that make sense for the type of products.
Keep product names short (max 30 chars). Keep store name max 30 chars. Keep storeAddress to one concise line.

Do NOT output anything harmful, offensive, or containing real people's personal data.`;

  const bedrock = createAmazonBedrock({ apiKey: env.AWS_BEDROCK_API_KEY });
  const { output: receipt } = await generateText({
    model: bedrock(env.AWS_BEDROCK_MODEL_ID),
    output: Output.object({ schema: aiReceiptSchema }),
    prompt,
  });

  return receipt;
}

async function generateLogoUrl(topic: string): Promise<string> {
  const replicate = new Replicate({
    auth: env.REPLICATE_API_KEY,
  });
  const model = 'black-forest-labs/flux-schnell';

  /**
   * @see https://replicate.com/black-forest-labs/flux-schnell/api/schema#input-schema
   */
  const input = {
    prompt: `A simple logo for a store selling products related to the topic: "${topic}". The logo should have a white background. Avoid text in the logo.`,
    megapixels: '0.25', // 512x512
  };

  const [output] = (await replicate.run(model, { input })) as [FileOutput];

  return output.url().toString();
}

export async function generateFakeReceipt(topic: string): Promise<Omit<RenderDataFakeReceipt, '_type' | 'topic'>> {
  const receipt = await generateReceiptContent(topic);
  const storeLogoUrl = await generateLogoUrl(topic);

  if (env.ENV === 'development') {
    console.log('Generated receipt:', JSON.stringify(receipt, null, 2));
  }

  const items = normalizeItems(receipt.items);
  const { subtotalCents, taxCents, totalCents, taxRateBps } = recomputeTotals(items, receipt.taxRateBps);

  return {
    storeLogoUrl,
    storeName: receipt.storeName.slice(0, 40),
    storeAddress: receipt.storeAddress.slice(0, 80),
    cashierName: receipt.cashierName.slice(0, 30),
    paymentMethod: receipt.paymentMethod.slice(0, 20),
    items,
    taxRateBps,
    subtotalCents,
    taxCents,
    totalCents,
    locale: receipt.locale ?? DEFAULT_LOCALE,
    currency: receipt.currency ?? DEFAULT_CURRENCY,
    dateTime: receipt.dateTime ?? new Date().toISOString(),
    footerMessage: receipt.footerMessage.slice(0, 120),
  };
}
