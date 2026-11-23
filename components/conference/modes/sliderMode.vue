<template>
  <div
    ref="containerRef"
    class="w-full flex gap-2"
    :class="isLandscape ? 'flex-row' : 'flex-col'"
    :style="{ height: `${availableHeight}px` }"
  >
    <div
      ref="mainAreaRef"
      class="flex-1 min-w-0 min-h-0 flex justify-center items-center"
    >
      <div v-if="mainStream && mainLayout" :style="mainStyle">
        <participantTile
          :stream="mainStream"
          :stats="peersStats[mainStream.peer_id]"
          :reflected="reflected"
        />
      </div>
    </div>

    <div
      v-if="streams.length > 1"
      class="shrink-0 flex gap-2 snap-mandatory overscroll-contain"
      :class="
        isLandscape
          ? 'flex-col overflow-y-auto snap-y w-[clamp(120px,18%,240px)]'
          : 'flex-row overflow-x-auto snap-x h-[clamp(80px,22%,150px)]'
      "
    >
      <button
        v-for="stream in streams"
        :key="stream.peer_id"
        type="button"
        class="snap-start shrink-0 rounded-[14px] border-2 duration-200"
        :class="[
          isLandscape ? 'w-full aspect-video' : 'h-full aspect-[4/3]',
          stream.peer_id === mainStream?.peer_id
            ? 'border-corp'
            : 'border-transparent hover:border-gray-400',
        ]"
        @click="selectedPeerId = stream.peer_id"
      >
        <participantTile
          :stream="stream"
          :stats="peersStats[stream.peer_id]"
          :reflected="reflected"
          :muted="stream.peer_id === mainStream?.peer_id"
          compact
        />
      </button>
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

  // Учитель по умолчанию показывается в главном окне
  mentorId: {
    type: [Number, String],
    required: false,
    default: null,
  },
});

const { streams } = toRefs(props);

const containerRef = ref(null);
const mainAreaRef = ref(null);
const containerWidth = ref(0);
const mainArea = ref({ width: 0, height: 0 });

const { height: availableHeight, update: updateHeight } =
  useAvailableHeight(containerRef);

const isLandscape = computed(
  () => containerWidth.value >= availableHeight.value,
);

const selectedPeerId = ref(null);

const defaultStream = computed(() => {
  const list = streams.value;
  const mentor =
    props.mentorId !== null &&
    list.find(
      (s) => s.remote && String(s.user_id) === String(props.mentorId),
    );
  return mentor || list.find((s) => s.remote) || list[0] || null;
});

const mainStream = computed(
  () =>
    streams.value.find((s) => s.peer_id === selectedPeerId.value) ||
    defaultStream.value,
);

const mainLayout = computed(() =>
  computeTileLayout(1, mainArea.value.width, mainArea.value.height),
);

const mainStyle = computed(() => ({
  width: `${mainLayout.value.width}px`,
  height: `${mainLayout.value.height}px`,
}));

let resizeObserver = null;

onMounted(() => {
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (entry.target === containerRef.value) {
        containerWidth.value = width;
        updateHeight();
      } else if (entry.target === mainAreaRef.value) {
        mainArea.value = { width, height };
      }
    }
  });
  resizeObserver.observe(containerRef.value);
  resizeObserver.observe(mainAreaRef.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>
