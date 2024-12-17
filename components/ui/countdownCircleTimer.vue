<template>
    <div v-if="!props.startCommand || timeIsUp"
        class="rounded-full flex flex-none items-center justify-center text-5xl text-success p-1 shadow-xl border-inactive w-16 h-16">
        <div class="w-full h-full border-2 rounded-full flex items-center justify-center text-3xl"
            :class="timeIsUp ? 'border-danger text-danger' : 'border-success text-success'">
            <i class="pi" :class="timeIsUp ? 'pi-times' : 'pi-check'"></i>
        </div>
    </div>
    <div v-else class=" rounded-full flex flex-none shadow-xl justify-center items-center relative w-16 h-16">
        <svg class="w-full h-full absolute left-0 right-0 -rotate-90" viewBox="0 0 100 100">
            <circle class="background-circle fill-none stroke-inactive" cx="50" cy="50" r="45" />
            <circle class="progress-circle fill-none" :class="progressClass" cx="50" cy="50" r="45"
                :style="circleStyle" />
        </svg>
        <div class="font-medium" :class="timerClass">{{ formattedTime }}</div>
    </div>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from 'vue';
import { playAudio, stopAudio } from '../../utils/playAudio';

const props = defineProps({
    totalSeconds: {
        type: Number,
        required: true,
        default: 30, // Дефолтное значение
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

const emit = defineEmits(['timeIsUp']);
const timeRemaining = ref(props.totalSeconds); // Время, оставшееся для таймера
const intervalId = ref(null);
const timeIsUp = ref(false);

// Флаг для контроля аудио
const hasPlayedAudio = ref(false);

// Вычисляем длину окружности для прогресс-бара
const circumference = 2 * Math.PI * 45;

const circleStyle = computed(() => {
    const progress = timeRemaining.value / props.totalSeconds;
    return {
        strokeDasharray: `${circumference}`,
        strokeDashoffset: `${circumference * (1 - progress)}`,
    };
});

// Форматируем оставшееся время в mm:ss
const formattedTime = computed(() => {
    const minutes = Math.floor(timeRemaining.value / 60);
    const seconds = timeRemaining.value % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;
});

const progressClass = computed(() => {
    const progress = timeRemaining.value / props.totalSeconds;

    if (progress <= 0.33) {
        return 'stroke-danger';
    } else if (progress <= 0.66) {
        return 'stroke-warning';
    } else {
        return 'stroke-success';
    }
});

const timerClass = computed(() => {
    const progress = timeRemaining.value / props.totalSeconds;

    if (progress <= 0.33 && !hasPlayedAudio.value) {
        stopAudio();
        // Проигрываем аудио только один раз при достижении 33% времени
        playAudio('/audio/magical-bell.aac');
        hasPlayedAudio.value = true; // Устанавливаем флаг, чтобы не проигрывать аудио снова
    }

    if (progress <= 0.33) {
        return 'pulse text-danger';
    }
});

const startTimer = () => {
    timeIsUp.value = false;
    hasPlayedAudio.value = false; // Сбрасываем флаг перед стартом таймера
    if (intervalId.value !== null) return; // Таймер уже работает
    timeRemaining.value = props.totalSeconds; // Сбрасываем оставшееся время
    intervalId.value = setInterval(() => {
        if (timeRemaining.value > 0) {
            timeRemaining.value -= 1;
        }
        if (timeRemaining.value === 0) {
            stopTimer(); // Вызывает завершение и emit
            timeIsUp.value = true;
            emit('timeIsUp'); // Отправляем событие завершения
        }
    }, 1000);
}

const stopTimer = () => {
    if (intervalId.value !== null) {
        clearInterval(intervalId.value);
        intervalId.value = null;
    }
};

// Слушаем изменение команды старта
watch(
    () => props.startCommand,
    (newVal) => {
        if (newVal) {
            startTimer();
        } else {
            stopTimer();
        }
    },
    { immediate: true }
);

// Если props.totalSeconds будет меняться сбрасывать таймер.
watch(
    () => props.totalSeconds,
    (newVal) => {
        if (intervalId.value === null) {
            timeRemaining.value = newVal;
        }
    },
    { immediate: true }
);

watch(
    () => props.isWrong,
    (newVal) => {
        timeIsUp.value = newVal;
    }
);

onUnmounted(() => {
    stopTimer();
});
</script>

<style scoped>
.background-circle {
    stroke-width: 4;
}

.progress-circle {
    stroke-width: 4;
    stroke-linecap: round;
    transition: stroke-dashoffset 1s ease-in-out, stroke 0.5s ease-in-out;
}
</style>