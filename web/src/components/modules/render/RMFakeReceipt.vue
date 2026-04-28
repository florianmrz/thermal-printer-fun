<template>
  <div class="rm-fake-receipt">
    <div class="store-header">
      <img class="store-logo" :src="props.data.storeLogoUrl" @load="handleLogoLoaded" />
      <div class="store-name">{{ props.data.storeName }}</div>
      <div class="store-info">
        <div v-for="(line, index) in props.data.storeAddress" :key="index">{{ line }}</div>
      </div>
      <div class="store-info" v-if="props.data.storePhoneNumber">{{ props.data.storePhoneNumber }}</div>
    </div>

    <div class="price-info">{{ t('fakeReceipt.priceInfo', { currency: props.data.currency }) }}</div>

    <div class="items">
      <div v-for="item in props.data.items" :key="item.name" class="item">
        <div class="item-row">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-total">{{ (item.lineTotalCents / 100).toFixed(2) }}</span>
        </div>
        <div v-if="item.quantity > 1" class="item-sub">
          {{ item.quantity }} x {{ (item.unitPriceCents / 100).toFixed(2) }}
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="totals">
      <div class="totals-row">
        <span>{{ t('fakeReceipt.subtotal') }}</span
        ><span>{{ formatAmount(props.data.subtotalCents) }}</span>
      </div>
      <div class="totals-row">
        <span>{{ t('fakeReceipt.taxWithRate', { rate: taxRateDisplay }) }}</span
        ><span>{{ formatAmount(props.data.taxCents) }}</span>
      </div>
    </div>

    <div class="divider double"></div>

    <div class="total-row">
      <span>{{ t('fakeReceipt.total') }}</span
      ><span>{{ formatAmount(props.data.totalCents) }}</span>
    </div>

    <div class="divider double"></div>

    <div class="payment-row">
      <span>{{ props.data.paymentMethod }}</span
      ><span>{{ formatAmount(props.data.totalCents) }}</span>
    </div>

    <div class="divider"></div>

    <div class="tax-table">
      <div class="tax-header">
        <span>{{ t('fakeReceipt.tax') }}</span>
        <span>{{ t('fakeReceipt.net') }}</span>
        <span>{{ t('fakeReceipt.taxAmount') }}</span>
        <span>{{ t('fakeReceipt.gross') }}</span>
      </div>
      <div class="tax-row">
        <span>{{ taxRateDisplay }}</span>
        <span>{{ formatAmount(props.data.subtotalCents) }}</span>
        <span>{{ formatAmount(props.data.taxCents) }}</span>
        <span>{{ formatAmount(props.data.totalCents) }}</span>
      </div>
    </div>

    <div class="divider"></div>

    <div class="receipt-meta">
      <div>
        <span>{{ t('fakeReceipt.cashier') }}</span>
        <span>{{ props.data.cashierName }}</span>
      </div>

      <div>
        <span>{{ t('fakeReceipt.date') }}</span>
        <span>{{ formattedDate }}</span>
      </div>
    </div>

    <svg ref="barcodeRef" class="barcode"></svg>

    <div class="divider"></div>

    <div class="footer-row">{{ props.data.footerMessage }}</div>

    <div class="qr-code">
      <canvas ref="qrCodeRef"></canvas>
    </div>
    <div class="footer-row">{{ t('fakeReceipt.visitUs', { url: props.data.storeWebsiteUrl }) }}</div>


    <div class="fake-watermark">
      {{ t('fakeReceipt.watermark') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RenderDataFakeReceipt } from '@thermal-printer-fun/shared';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { normalizeLocale } from '../../../i18n';
import env from '../../../utils/env';
import type { RenderModuleProps } from './types';

const props = defineProps<RenderModuleProps<RenderDataFakeReceipt>>();

const { t, locale } = useI18n();

const barcodeRef = ref<SVGSVGElement>();
const qrCodeRef = ref<HTMLCanvasElement>();

const currencyFormatter = computed(
  () =>
    new Intl.NumberFormat(props.data.locale, {
      style: 'currency',
      currency: props.data.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
);

function formatAmount(cents: number): string {
  return currencyFormatter.value.format(cents / 100);
}

const taxRateDisplay = computed(() => {
  const pct = props.data.taxRateBps / 100;
  return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}%`;
});

const formattedDate = computed(() => {
  return new Intl.DateTimeFormat(props.data.locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date());
});

onMounted(async () => {
  locale.value = normalizeLocale(props.data.locale);

  /**
   * @see https://github.com/lindell/JsBarcode/wiki/Options
   */
  const barcodeValue = Math.random().toString(36).substring(2, 12);
  JsBarcode(barcodeRef.value, barcodeValue, {
    format: 'CODE39',
    width: 3,
    margin: 0,
    height: 48,
    textMargin: 5,
    fontSize: 24,
  });

  /**
   * @see https://github.com/soldair/node-qrcode#options
   */
  await QRCode.toCanvas(qrCodeRef.value!, env.VITE_BASE_URL, {
    width: 250,
    margin: 0,
  });

  setTimeout(() => {
    // Fallback in case logo load does not fire
    props.onReady();
  }, 500);
});

function handleLogoLoaded() {
  props.onReady();
}
</script>

<style lang="scss" src="./RMFakeReceipt.scss" scoped />
