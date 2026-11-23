<template>
  <div
    ref="containerRef"
    class="w-full flex justify-center items-center"
    :style="{ height: `${availableHeight}px` }"
  >
    <div
      class="flex flex-wrap justify-center content-center"
      :style="{ gap: `${GAP}px`, width: rowWidth }"
    >
      <div
        v-for="stream in streams"
        :key="stream.peer_id"
        :style="tileStyle"
      >
        <participantTile
          :stream="stream"
          :stats="peersStats[stream.peer_id]"
          :reflected="reflected"
          :compact="isCompact"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, toRefs, onMounted, onBeforeUnmount } from "vue";
import participantTile from "~/components/conference/participantTile.vue";
import { computeTileLayout } from "~/utils/conferenceLayout.js";
import { useAvailableHeight } from "~/composables/useAvailableHeight.js";

const props = defineProps({
  streams: {
    type: Array,
    required: true,
  },

  peersStats: {
    type: Object,
    required: true,
  },

  reflected: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const { streams } = toRefs(props);

const GAP = 8;
const COMPACT_TILE_WIDTH = 220;

const containerRef = ref(null);
const containerWidth = ref(0);
const { height: availableHeight, update: updateHeight } =
  useAvailableHeight(containerRef);

const layout = computed(() =>
  computeTileLayout(
    streams.value.length,
    containerWidth.value,
    availableHeight.value,
    {
      gap: GAP,
      minRatio: containerWidth.value >= availableHeight.value ? 1 : 3 / 4,
    },
  ),
);

// +2px запаса: при масштабе Windows 125–150% из-за округления пикселей
// ряд, посчитанный впритык, может перенести последнюю плитку на новую строку
const rowWidth = computed(() =>
  layout.value
    ? `${layout.value.cols * layout.value.width + (layout.value.cols - 1) * GAP + 2}px`
    : "100%",
);

// Пока размеры не измерены, плитки не показываем: иначе они на мгновение
// получаются огромными, вылезают из контейнера и перекрывают кнопки выше
const tileStyle = computed(() =>
  layout.value
    ? { width: `${layout.value.width}px`, height: `${layout.value.height}px` }
    : { width: 0, height: 0, overflow: "hidden" },
);

const isCompact = computed(
  () => !!layout.value && layout.value.width < COMPACT_TILE_WIDTH,
);

let resizeObserver = null;

onMounted(() => {
  resizeObserver = new ResizeObserver(([entry]) => {
    containerWidth.value = entry.contentRect.width;
    updateHeight();
  });
  resizeObserver.observe(containerRef.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>
