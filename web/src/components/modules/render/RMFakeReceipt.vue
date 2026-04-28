<template>
  <div class="rm-fake-receipt">
    <div class="store-header">
      <img class="store-logo" :src="props.data.storeLogoUrl" />
      <div class="store-name">{{ props.data.storeName }}</div>
      <div class="store-address">{{ props.data.storeAddress }}</div>
    </div>

    <div class="divider"></div>

    <div class="col-header">EUR</div>

    <div class="items">
      <div v-for="item in props.data.items" :key="item.name" class="item">
        <div class="item-row">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-total">{{ formatAmount(item.lineTotalCents) }}</span>
        </div>
        <div v-if="item.quantity > 1" class="item-sub">
          {{ item.quantity }} x {{ formatAmount(item.unitPriceCents) }}
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="totals">
      <div class="totals-row">
        <span>Subtotal</span><span>{{ formatAmount(props.data.subtotalCents) }}</span>
      </div>
      <div class="totals-row">
        <span>Tax ({{ taxRateDisplay }})</span><span>{{ formatAmount(props.data.taxCents) }}</span>
      </div>
    </div>

    <div class="divider double"></div>

    <div class="total-row">
      <span>TOTAL</span><span>{{ formatAmount(props.data.totalCents) }}</span>
    </div>

    <div class="divider double"></div>

    <div class="payment-row">
      <span>{{ props.data.paymentMethod }}</span
      ><span>{{ formatAmount(props.data.totalCents) }}</span>
    </div>

    <div class="divider"></div>

    <div class="tax-table">
      <div class="tax-header">
        <span>Tax</span>
        <span>Net</span>
        <span>Tax amt</span>
        <span>Gross</span>
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
      <span>{{ props.data.cashierName }}</span>
      <span>{{ formattedDate }} {{ formattedTime }}</span>
    </div>

    <div class="divider"></div>

    <div class="footer">{{ props.data.footerMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import type { RenderDataFakeReceipt } from '@thermal-printer-fun/shared';
import { computed, onMounted } from 'vue';
import type { RenderModuleProps } from './types';

const props = defineProps<RenderModuleProps<RenderDataFakeReceipt>>();

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
  return new Intl.DateTimeFormat(props.data.locale, { dateStyle: 'short' }).format(new Date(props.data.dateTime));
});

const formattedTime = computed(() => {
  return new Intl.DateTimeFormat(props.data.locale, { timeStyle: 'short' }).format(new Date(props.data.dateTime));
});

onMounted(async () => {
  props.onReady();
});
</script>

<style lang="scss" src="./RMFakeReceipt.scss" scoped />
