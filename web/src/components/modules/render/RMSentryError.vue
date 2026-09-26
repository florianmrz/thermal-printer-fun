<template>
  <div class="rm-sentry-error">
    <SentryLogo class="logo" />

    <div class="header">
      <div class="project">{{ data.projectName ?? 'Unknown Project' }}</div>
      <div class="issue-id">#{{ data.data.issue_id }}</div>
    </div>

    <div class="meta-row">
      <div v-if="data.data?.level" class="level-badge">
        {{ data.data.level.toUpperCase() }}
      </div>
      <div v-if="formattedTimestamp" class="timestamp">{{ formattedTimestamp }}</div>
    </div>

    <div class="error-title">{{ data.data?.title ?? 'Unknown Error' }}</div>

    <div v-if="data.data?.culprit" class="section">
      <div class="section-label">Culprit</div>
      <div class="section-value">{{ data.data.culprit }}</div>
    </div>

    <div v-if="data.data?.request?.url" class="section">
      <div class="section-label">URL</div>
      <div class="section-value url-value">{{ data.data.request.url }}</div>
    </div>

    <div v-if="tags.length" class="section">
      <div class="section-label">Tags</div>
      <div class="tags">
        <div v-for="([key, value], i) in tags" :key="i" class="tag">
          <span class="tag-key">{{ key }}</span>
          <span class="tag-value">{{ value }}</span>
        </div>
      </div>
    </div>

    <div v-if="frames.length" class="section">
      <div class="section-label">Stacktrace</div>
      <div class="stacktrace">
        <div v-for="(frame, i) in frames" :key="i" class="stack-frame">
          <div class="frame-function">{{ frame.function || '(anonymous)' }}</div>
          <div class="frame-location">{{ frame.filename }}:{{ frame.lineno }}:{{ frame.colno }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RenderDataSentryError } from '@thermal-printer-fun/shared';
import { computed, onMounted } from 'vue';
import type { RenderModuleProps } from './types';
import SentryLogo from '~/assets/images/sentry-logo.svg';

const props = defineProps<RenderModuleProps<RenderDataSentryError>>();

const formattedTimestamp = computed(() => {
  const timestamp = props.data.data?.timestamp;
  if (!timestamp) {
    return '';
  }
  return new Date(timestamp * 1000).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });
});

const tags = computed(() =>
  (props.data.data?.tags ?? [])
    .filter((tag): tag is [string, string] => Array.isArray(tag) && tag.length >= 2)
    .filter(([key]) => !['url', 'level'].includes(key)) // Filter out tags that are already displayed somewhere else
);

const frames = computed(() => {
  const exceptionValues = props.data.data?.exception?.values;
  if (!exceptionValues?.length) {
    return [];
  }

  const lastException = exceptionValues[exceptionValues.length - 1];

  return (lastException?.stacktrace?.frames ?? []).reverse().filter(frame => frame != null);
});

onMounted(async () => {
  props.onReady();
});
</script>

<style lang="scss" src="./RMSentryError.scss" scoped />
