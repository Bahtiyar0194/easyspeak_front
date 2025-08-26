<script setup>
import { ref } from "vue";

const props = defineProps({
  images: { type: Array, required: true },
});

const current = ref(0);

function next() {
  current.value = (current.value + 1) % props.images.length;
}

function prev() {
  current.value =
    (current.value - 1 + props.images.length) % props.images.length;
}
</script>

<template>
  <!-- Основная карусель -->
  <div class="relative w-full">
    <!-- Лента -->
    <div class="py-20 md:py-48 overflow-hidden">
      <div
        class="flex items-center transition-transform duration-500 ease-in-out"
        :style="{
          transform: `translateX(${
            current === 0 ? '0' : '-' + current * (100 / 3)
          }%)`,
        }"
      >
        <div class="w-1/3 flex-shrink-0 flex items-center justify-center">
          <img
            :src="props.images[props.images.length - 1]"
            class="scale-90 opacity-50 blur-sm rounded-xl"
            draggable="false"
          />
        </div>
        <div
          v-for="(src, idx) in images"
          :key="idx"
          class="w-1/3 flex-shrink-0 flex items-center justify-center"
        >
          <img
            :src="src"
            class="transition-all duration-200"
            draggable="false"
            :class="{
              'z-10 scale-[2.5] md:scale-[2] rounded-lg': idx === current, // центральный
              'scale-90 opacity-50 blur-sm rounded-xl': idx !== current, // боковые
            }"
          />
        </div>
        <div class="w-1/3 flex-shrink-0 flex items-center justify-center">
          <img
            :src="props.images[0]"
            class="scale-90 opacity-50 blur-sm rounded-xl"
            draggable="false"
          />
        </div>
      </div>
    </div>

    <!-- Кнопки -->
    <button
      @click="prev"
      class="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-inactive opa border-inactive !border-2 rounded-full transition"
    >
      <i class="pi pi-chevron-left"></i>
    </button>
    <button
      @click="next"
      class="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-inactive opa border-inactive !border-2 rounded-full transition"
    >
      <i class="pi pi-chevron-right"></i>
    </button>
  </div>

  <!-- Миниатюры -->
  <div class="flex gap-2 mt-4 justify-center flex-wrap">
    <button
      v-for="(src, idx) in images"
      :key="`thumb-${idx}`"
      class="!border-2 rounded-xl overflow-hidden p-0.5"
      :class="current === idx ? 'border-corp' : 'border-inactive'"
      @click="current = idx"
    >
      <img
        :src="src"
        class="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
        draggable="false"
      />
    </button>
  </div>
</template>
