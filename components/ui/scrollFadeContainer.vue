<template>
  <div
    ref="container"
    class="scroll-fade"
    :class="maskClass"
    :style="{
      maxHeight: props.maxHeight + 'px',
      '--fade': props.fadeSize + 'px',
    }"
    @scroll="onScroll"
  >
    <slot />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const props = defineProps({
  maxHeight: {
    type: Number,
    required: true,
  },
  fadeSize: {
    type: Number,
    default: 40,
  },
});

const container = ref(null);
const isAtTop = ref(true);
const isAtBottom = ref(false);

const onScroll = () => {
  const el = container.value;
  if (!el) return;

  isAtTop.value = el.scrollTop <= 0;
  isAtBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
};

onMounted(onScroll);

const maskClass = computed(() => {
  if (isAtTop.value && isAtBottom.value) return "mask-none";
  if (isAtTop.value) return "mask-bottom";
  if (isAtBottom.value) return "mask-top";
  return "mask-both";
});
</script>
