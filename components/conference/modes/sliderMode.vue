<template>
  <div class="custom-grid !gap-1">
    <div v-if="mainStream" class="col-span-12 lg:col-span-10">
      <div
        class="relative rounded-lg overflow-hidden"
        :class="
          mainStream.volume > 50 ? 'border-success' : 'border-transparent'
        "
      >
        <div
          class="absolute py-1 px-1.5 bg-black bg-opacity-50 z-10 text-white rounded-md left-1 md:left-2 top-1 md:top-2 flex gap-1"
        >
          <span class="text-xs">{{ mainStream.userInfo.first_name }}</span>
        </div>
        <video
          class="w-full h-full aspect-[4/3] md:aspect-video object-cover"
          :srcObject="mainStream.stream"
          :muted="!mainStream.remote"
          autoplay
          playsinline
        ></video>

        <div
          class="absolute py-1 px-1.5 md:px-2 bg-black bg-opacity-50 z-10 text-white rounded-md right-2 top-2 flex gap-1 md:gap-2"
        >
          <i
            class="bi text-xs"
            :class="
              !mainStream.isMuted
                ? 'bi-mic text-success'
                : 'bi-mic-mute text-danger'
            "
          ></i>
          <i
            class="bi text-xs"
            :class="
              mainStream.isStream
                ? 'bi-camera-video text-success'
                : 'bi-camera-video-off text-danger'
            "
          ></i>
        </div>
      </div>
    </div>
    <div class="col-span-12 lg:col-span-2">
      <div class="keen-slider w-full h-fit" ref="sliderRef">
        <div
          class="keen-slider__slide"
          v-for="(stream, streamIndex) in props.streams"
          :key="stream.peer_id"
        >
          <div
            class="relative rounded-lg overflow-hidden border-2 hover:cursor-pointer"
            :class="
              stream.volume > 50 ? 'border-success' : 'border-transparent'
            "
            @click="setMainStream(streamIndex)"
          >
            <div
              class="absolute py-1 px-1.5 bg-black bg-opacity-50 z-10 text-white rounded-md left-1 md:left-2 top-1 md:top-2 flex gap-1"
            >
              <span class="text-xs">{{ stream.userInfo.first_name }}</span>
            </div>
            <video
              class="w-full h-full aspect-[4/3] md:aspect-video object-cover"
              :srcObject="stream.stream"
              :muted="!stream.remote"
              autoplay
              playsinline
            ></video>

            <div
              class="absolute py-1 px-1.5 md:px-2 bg-black bg-opacity-50 z-10 text-white rounded-md right-2 bottom-2 flex gap-1 md:gap-2"
            >
              <i
                class="bi text-xs"
                :class="
                  !stream.isMuted
                    ? 'bi-mic text-success'
                    : 'bi-mic-mute text-danger'
                "
              ></i>
              <i
                class="bi text-xs"
                :class="
                  stream.isStream
                    ? 'bi-camera-video text-success'
                    : 'bi-camera-video-off text-danger'
                "
              ></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import KeenSlider from "keen-slider";

const props = defineProps({
  streams: {
    type: Array,
    required: true,
  },
});

const sliderRef = ref(null);

const { streams } = toRefs(props);

const mainStream = ref(null);

const setMainStream = (streamIndex) => {
  mainStream.value = streams.value[streamIndex];
};

onMounted(() => {
  new KeenSlider(sliderRef.value, {
    vertical: true,
    loop: false,
    slides: {
      perView: "auto", // ключевая настройка
      spacing: 0,
    },
    breakpoints: {
      "(max-width: 768px)": {
        vertical: false,
        slides: {
          perView: 2.5
        },
      },
    },
  });
});

watch(
  () => streams.value.length,
  (newVal) => {
    if (streams.value.length > 0) {
      mainStream.value = streams.value[0];
    } else {
      mainStream.value = null;
    }
  },
  { immediate: true }
);
</script>
