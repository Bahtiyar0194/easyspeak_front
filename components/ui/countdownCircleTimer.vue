<template>
  <!-- Таймер не запущен / задание выполнено (✓) или время вышло (✕) -->
  <div
    v-if="!props.startCommand || timeIsUp"
    class="timer-ring timer-result"
    :class="timeIsUp ? 'is-fail' : 'is-ok'"
    role="img"
    :aria-label="timeIsUp ? $t('time_is_up') : ''"
  >
    <i class="pi" :class="timeIsUp ? 'pi-times' : 'pi-check'" aria-hidden="true"></i>
  </div>

  <!-- Идёт отсчёт -->
  <div
    v-else
    class="timer-ring"
    :class="[stageClass, { 'is-urgent': isUrgent }]"
    role="timer"
    :aria-label="$t('remaining_time') + ': ' + formattedTime"
  >
    <svg class="ring-progress-svg" viewBox="0 0 100 100" aria-hidden="true">
      <circle class="ring-progress-track" cx="50" cy="50" r="42" />
      <circle
        class="timer-arc"
        cx="50"
        cy="50"
        r="42"
        :style="circleStyle"
      />
    </svg>
    <span class="timer-value">{{ formattedTime }}</span>
  </div>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from "vue";
import { playAudio, stopAudio } from "../../utils/playAudio";

const props = defineProps({
  totalSeconds: {
    type: Number,
    required: true,
    default: 30,
  },
  startCommand: {
    type: Boolean,
    required: true,
  },
  isWrong: {
    type: Boolean,
    required: false,
  },
});

const emit = defineEmits(["timeIsUp"]);
const timeRemaining = ref(props.totalSeconds);
const intervalId = ref(null);
const timeIsUp = ref(false);

// Звонок «осталась треть времени» — один раз за запуск
const hasPlayedAudio = ref(false);

const circumference = 2 * Math.PI * 42;

const fraction = computed(() =>
  props.totalSeconds > 0 ? timeRemaining.value / props.totalSeconds : 0,
);

const circleStyle = computed(() => ({
  strokeDasharray: `${circumference}`,
  strokeDashoffset: `${circumference * (1 - fraction.value)}`,
}));

// mm:ss
const formattedTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60);
  const seconds = timeRemaining.value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});

// Цвет дуги: больше 2/3 — зелёный, больше 1/3 — янтарный, дальше — красный
const stageClass = computed(() => {
  if (fraction.value <= 0.33) return "is-low";
  if (fraction.value <= 0.66) return "is-mid";
  return "is-high";
});

const isUrgent = computed(() => fraction.value <= 0.33);

// Побочный эффект (звук) — в watch, а не внутри computed
watch(isUrgent, (urgent) => {
  if (urgent && intervalId.value !== null && !hasPlayedAudio.value) {
    stopAudio();
    playAudio("/audio/magical-bell.aac", {
      onEnded: () => {},
      onLoading: () => {},
    });
    hasPlayedAudio.value = true;
  }
});

const startTimer = () => {
  timeIsUp.value = false;
  hasPlayedAudio.value = false;
  if (intervalId.value !== null) return; // уже работает
  timeRemaining.value = props.totalSeconds;
  intervalId.value = setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value -= 1;
    }
    if (timeRemaining.value === 0) {
      stopTimer();
      timeIsUp.value = true;
      emit("timeIsUp");

      stopAudio();
      playAudio("/audio/game-over.mp3", {
        onEnded: () => {},
        onLoading: () => {},
      });
    }
  }, 1000);
};

const stopTimer = () => {
  if (intervalId.value !== null) {
    clearInterval(intervalId.value);
    intervalId.value = null;
  }
};

watch(
  () => props.startCommand,
  (newVal) => {
    if (newVal) {
      startTimer();
    } else {
      stopTimer();
    }
  },
  { immediate: true },
);

// Смена длительности, пока таймер стоит, — сбрасываем время
watch(
  () => props.totalSeconds,
  (newVal) => {
    if (intervalId.value === null) {
      timeRemaining.value = newVal;
    }
  },
  { immediate: true },
);

watch(
  () => props.isWrong,
  (newVal) => {
    timeIsUp.value = newVal;
  },
);

onUnmounted(() => {
  stopTimer();
});
</script>
