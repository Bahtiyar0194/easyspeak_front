<template>
  <span>{{ formatNumber(displayNumber) }}</span>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";

const props = defineProps({
  number: { type: Number, required: true }, // целевое число
  duration: { type: Number, default: 1000 }, // длительность анимации (мс)
});

const displayNumber = ref(props.number); // то, что показываем

const formatNumber = (num) => {
  return new Intl.NumberFormat("ru-RU").format(num); // формат "10 000"
};

let animationFrame;

const animateTo = (newValue, oldValue) => {
  const startTime = performance.now();

  const step = (currentTime) => {
    const progress = Math.min((currentTime - startTime) / props.duration, 1);
    displayNumber.value = Math.floor(
      oldValue + (newValue - oldValue) * progress
    );

    if (progress < 1) {
      animationFrame = requestAnimationFrame(step);
    }
  };

  cancelAnimationFrame(animationFrame);
  requestAnimationFrame(step);
};

// следим за изменением props.number
watch(
  () => props.number,
  (newValue, oldValue) => {
    animateTo(newValue, oldValue);
  }
);

// при первом рендере тоже красиво поднимаем число
onMounted(() => {
  animateTo(props.number, 0);
});
</script>
