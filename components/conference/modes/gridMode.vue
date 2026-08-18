<template>
  <div class="grid" :class="gridClass">
    <div
      class="border-2 relative overflow-hidden rounded-xl border-"
      v-for="stream in props.streams"
      :key="stream.peer_id"
      :class="[
        stream.volume > 50 ? 'border-success' : 'border-transparent',
        props.streams.length === 1 ? 'col-span-12 md:col-span-6 md:col-start-3' : '',
      ]"
    >
      <div
        v-if="stream.isStream"
        class="absolute py-1 px-1.5 md:px-2 bg-black bg-opacity-50 z-10 text-white rounded-md left-2 top-2 flex"
      >
        <span class="text-xs md:text-base">{{
          stream.userInfo.first_name
        }}</span>
      </div>

      <div
        v-else
        class="bg-black text-white w-full h-full flex flex-col gap-1 justify-center items-center text-center px-2 select-none"
      >
        <span class="text-lg md:text-2xl font-medium">{{ stream.userInfo.last_name + " " + stream.userInfo.first_name }}</span>
        <span class="text-inactive text-xs">({{ $t("pages.conference.video_turned_off") }})</span>
      </div>

      <video
        class="w-full h-full aspect-square md:aspect-video object-cover"
        :srcObject="stream.stream"
        :muted="!stream.remote"
        autoplay
        playsinline
      ></video>

      <div
        class="absolute py-1 px-1.5 md:px-2 bg-black bg-opacity-50 z-10 text-white rounded-md right-2 top-2 flex gap-1 md:gap-2"
      >
        <i
          class="bi text-xs md:text-base"
          :class="
            !stream.isMuted ? 'bi-mic text-success' : 'bi-mic-mute text-danger'
          "
        ></i>
        <i
          class="bi text-xs md:text-base"
          :class="
            stream.isStream
              ? 'bi-camera-video text-success'
              : 'bi-camera-video-off text-danger'
          "
        ></i>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  streams: {
    type: Array,
    required: true,
  },
});

import { computed } from "vue";

const gridClass = computed(() => {
  const count = props.streams.length;

  if (count === 1) return "grid-cols-10";
  if (count === 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-3";
  if (count === 4) return "grid-cols-4";
  if (count <= 6) return "grid-cols-2 md:grid-cols-3";
  if (count <= 8) return "grid-cols-3 md:grid-cols-4";
  return "grid-cols-4";
});
</script>
