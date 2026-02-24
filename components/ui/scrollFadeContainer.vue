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
    default: 80,
  },
});

const container = ref(null);
const isAtTop = ref(true);
const isAtBottom = ref(false);

let resizeObserver = null;

/* ---------- scroll helpers ---------- */

const scrollToTop = (smooth = false) => {
  if (!container.value) return;

  container.value.scrollTo({
    top: 0,
    behavior: smooth ? "smooth" : "auto",
  });
};

const scrollToBottom = (smooth = false) => {
  if (!container.value) return;

  container.value.scrollTo({
    top: container.value.scrollHeight,
    behavior: smooth ? "smooth" : "auto",
  });
};

const isNearBottom = (offset = 40) => {
  const el = container.value;
  if (!el) return false;

  return el.scrollHeight - el.scrollTop - el.clientHeight < offset;
};

/* ---------- scroll handler ---------- */

const onScroll = () => {
  const el = container.value;
  if (!el) return;

  isAtTop.value = el.scrollTop <= 0;
  isAtBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
};

/* ---------- lifecycle ---------- */

onMounted(async () => {
  await nextTick();

  onScroll();

  // 👇 следим за изменением размеров контейнера
  resizeObserver = new ResizeObserver(() => {
    onScroll(); // пересчёт maskClass
  });

  resizeObserver.observe(container.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

/* ---------- fade mask ---------- */

const maskClass = computed(() => {
  if (isAtTop.value && isAtBottom.value) return "mask-none";
  if (isAtTop.value) return "mask-bottom";
  if (isAtBottom.value) return "mask-top";
  return "mask-both";
});

defineExpose({
  scrollToTop,
  scrollToBottom,
});
</script>
