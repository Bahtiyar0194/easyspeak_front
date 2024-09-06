<template>
    <div class="grid gap-1" :class="gridClass">
        <div class="border-2 relative overflow-hidden rounded-lg" v-for="stream in streams" :key="stream.peer_id"
            :class="stream.volume > 50 ? 'border-success' : 'border-transparent'">

            <div v-if="stream.isStream"
                class="absolute py-1 px-1.5 md:px-2 bg-black bg-opacity-50 z-10 text-white rounded-md left-2 top-2 flex">
                <span class="text-xs md:text-base">{{ stream.userInfo.first_name }}</span>
            </div>

            <div v-else
                class="bg-black text-white w-full h-full flex justify-center items-center text-center md:text-2xl px-2">
                {{ stream.userInfo.last_name + ' ' + stream.userInfo.first_name }}
            </div>

            <video class="w-full h-full object-cover" :srcObject="stream.stream" :muted="!stream.remote" autoplay
                playsinline></video>

            <div
                class="absolute py-1 px-1.5 md:px-2 bg-black bg-opacity-50 z-10 text-white rounded-md right-2 top-2 flex gap-1 md:gap-2">
                <i class="bi text-xs md:text-base"
                    :class="!stream.isMuted ? 'bi-mic text-success' : 'bi-mic-mute text-danger'"></i>
                <i class="bi text-xs md:text-base"
                    :class="stream.isStream ? 'bi-camera-video text-success' : 'bi-camera-video-off text-danger'"></i>
            </div>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    streams: {
        type: Array,
        required: true
    }
});

import { computed } from 'vue';

const gridClass = computed(() => {
    const count = props.streams.length;

    if (count === 1) {
        return 'grid-cols-1 md:grid-cols-2';
    }
    else if (count === 2) {
        return 'grid-cols-2 md:grid-cols-2';
    }
    else if (count === 3) {
        return 'grid-cols-2 md:grid-cols-3';
    }
    else {
        return 'grid-cols-2 md:grid-cols-4';
    }
});
</script>