<template>
  <div class="base-popover">
    <div ref="reference">
      <slot name="trigger" :isOpen="isOpen" />
    </div>

    <Teleport to="body">
      <div v-if="isOpen" ref="floating" class="content" :style="floatingStyles" role="dialog" aria-modal="false">
        <slot />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { autoUpdate, flip, offset as floatingUiOffset, shift, useFloating, type Placement } from '@floating-ui/vue';
import { useElementHover, useEventListener } from '@vueuse/core';
import { computed, ref, useTemplateRef } from 'vue';

const props = withDefaults(
  defineProps<{
    placement?: Placement;
    offset?: number;
  }>(),
  {
    placement: 'bottom-end',
    offset: 8,
  }
);

const $reference = useTemplateRef('reference');
const $floating = useTemplateRef('floating');

const referenceHovered = useElementHover($reference, { delayLeave: 100 });
const floatingHovered = useElementHover($floating);

const isFocused = ref(false);
const isOpen = computed(() => isFocused.value || referenceHovered.value || floatingHovered.value);

const { floatingStyles } = useFloating($reference, $floating, {
  placement: props.placement,
  middleware: [floatingUiOffset(props.offset), flip(), shift({ padding: 8 })],
  whileElementsMounted: autoUpdate,
});

// We are using focusin/focusout instead of focus/blur because the latter do not bubble the event
useEventListener($reference, 'focusin', () => (isFocused.value = true));
useEventListener($reference, 'focusout', () => (isFocused.value = false));
</script>

<style src="./BasePopover.scss" lang="scss" scoped />
