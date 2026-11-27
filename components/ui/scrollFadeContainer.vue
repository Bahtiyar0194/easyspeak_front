<template>
  <div
    ref="container"
    class="scroll-fade"
    :class="maskClass"
    :style="{
      maxHeight: props.maxHeight + 'px',
      '--fade': props.fadeSize + 'px',
    }"
    :tabindex="isScrollable ? 0 : undefined"
    @scroll.passive="onScroll"
  >
    <!-- Обёртка нужна, чтобы замечать рост содержимого (новые сообщения и т.п.) -->
    <div ref="content">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useScrollChain } from "~/composables/useScrollChain";

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
const content = ref(null);
const isAtTop = ref(true);
const isAtBottom = ref(true);

let resizeObserver = null;
let rafId = null;

// Упёрлись в край — колесо сразу прокручивает родителя
useScrollChain(container);

/* ---------- scroll helpers ---------- */

const scrollToTop = (smooth = false) => {
  if (!container.value) return;
  container.value.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
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

/* ---------- состояние краёв ---------- */

const update = () => {
  const el = container.value;
  if (!el) return;
  isAtTop.value = el.scrollTop <= 1;
  isAtBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
};

// Не чаще одного пересчёта за кадр
const onScroll = () => {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    update();
  });
};

const isScrollable = computed(() => !(isAtTop.value && isAtBottom.value));

/* ---------- lifecycle ---------- */

onMounted(async () => {
  await nextTick();
  update();

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => update());
    // и сам контейнер, и его содержимое: при росте контента после достижения
    // maxHeight размер контейнера уже не меняется
    resizeObserver.observe(container.value);
    if (content.value) resizeObserver.observe(content.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  if (rafId) cancelAnimationFrame(rafId);
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
  isNearBottom,
});
</script>
