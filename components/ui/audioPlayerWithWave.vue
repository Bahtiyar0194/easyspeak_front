<template>
    <div class="flex items-center gap-x-4">
        <button type="button" class="btn btn-square btn-lg btn-primary" :class="props.className" @click="toggleAudio"
            :title="$t('click_to_listen_to_the_audio')">
            <i class="pi" :class="isPlaying ? 'pi-pause' : 'pi-volume-up'"></i>
        </button>
        <div ref="waveform" style="width: 100%; height: 36px;"></div>
    </div>
</template>

<script setup>
import WaveSurfer from 'wavesurfer.js';
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
    src: {
        type: String,
        required: true
    },
    className: {
        type: String,
        required: false
    }
});

const waveform = ref(null);
const isPlaying = ref(false);
let waveSurferInstance = null;

onMounted(() => {
    // Инициализация Wavesurfer
    waveSurferInstance = WaveSurfer.create({
        container: waveform.value,
        waveColor: '#ddd',
        progressColor: '#4a90e2',
        cursorColor: '#333',
        barWidth: 2,
        height: 36,
        responsive: true,
    });

    // Загрузка аудиофайла
    waveSurferInstance.load(props.src);

    // Обработка изменения состояния воспроизведения
    waveSurferInstance.on('finish', () => {
        isPlaying.value = false;
    });
});

const toggleAudio = () => {
    if (waveSurferInstance.isPlaying()) {
        waveSurferInstance.pause();
        isPlaying.value = false;
    } else {
        waveSurferInstance.play();
        isPlaying.value = true;
    }
};

onBeforeUnmount(() => {
    if (waveSurferInstance) {
        waveSurferInstance.destroy();
    }
});
</script>
