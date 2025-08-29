<template>
  <div
    class="absolute w-full h-full left-0 top-0 bg-active flex justify-center items-center z-10 select-none"
  >
    <div class="flex flex-col gap-y-4">
      <transition name="fade" mode="out-in">
        <span
          v-if="current > 0"
          :key="current"
          class="relative text-9xl text-center text-corp"
          >{{ current }}</span
        >
      </transition>

      <p class="font-medium text-2xl text-center">{{ $t("get_ready") }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const current = ref(3); // Начальное значение таймера
let interval; // Переменная для хранения идентификатора таймера

function startCountdown() {
  interval = setInterval(() => {
    if (current.value > 1) {
      current.value--; // Уменьшаем значение
    } else {
      clearInterval(interval); // Останавливаем таймер
      current.value = 0; // Устанавливаем финальное значение
    }
  }, 1000); // Интервал в 1 секунду
}

// Запуск таймера при монтировании компонента
onMounted(() => {
  startCountdown();
});

// Очистка таймера при размонтировании компонента
onUnmounted(() => {
  clearInterval(interval);
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s, transform 0.1s;
  /* Добавляем transform */
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
  /* Уменьшаем масштаб в начале и конце */
}

.fade-enter-to,
.fade-leave-from {
  transform: scale(1);
  /* Масштаб возвращается к 1 */
}
</style>
