<template>
    <div v-if="!props.startCommand || timeIsUp"
        class="rounded-full flex items-center justify-center text-5xl text-success p-1 shadow-xl border-inactive"
        :style="{ width: props.size + 'px', height: props.size + 'px' }">
        <div
            class="w-full h-full border-4 rounded-full flex items-center justify-center text-5xl" :class="timeIsUp ? 'border-danger text-danger' : 'border-success text-success'">
            <i class="pi" :class="timeIsUp ? 'pi-times' : 'pi-check'"></i>
        </div>
    </div>
    <div v-else class=" rounded-full flex shadow-xl justify-center items-center relative"
        :style="{ width: props.size + 'px', height: props.size + 'px' }">
        <svg class="w-full h-full absolute left-0 right-0 -rotate-90" viewBox="0 0 100 100">
            <circle class="background-circle fill-none stroke-inactive" cx="50" cy="50" r="45" />
            <circle class="progress-circle fill-none" :class="progressClass" cx="50" cy="50" r="45"
                :style="circleStyle" />
        </svg>
        <div class="font-medium text-2xl" :class="timerClass">{{ formattedTime }}</div>
    </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

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
    size: {
        type: Number,
        default: 200,
        required: false
    },
});

const emit = defineEmits(['timeIsUp']);
const timeRemaining = ref(props.totalSeconds); // Время, оставшееся для таймера
const intervalId = ref(null);
const timeIsUp = ref(false);

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

    if (progress <= 0.33) {
        return 'pulse';
    }
});

const startTimer = () => {
    timeIsUp.value = false;
    if (intervalId.value !== null) return; // Таймер уже работает
    timeRemaining.value = props.totalSeconds; // Сбрасываем оставшееся время
    intervalId.value = setInterval(() => {
        if (timeRemaining.value > 0) {
            timeRemaining.value -= 1;
        } else {
            stopTimer();
        }
    }, 1000);
}

const stopTimer = () => {
    if (intervalId.value !== null) {
        clearInterval(intervalId.value);
        intervalId.value = null;
        if (timeRemaining.value === 0) {
            timeIsUp.value = true;
            emit('timeIsUp'); // Отправляем событие завершения
        }
    }
}

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

onUnmounted(() => stopTimer());
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