<template>
    <!-- Preview for image or audio files -->
    <div class="card p-4" :class="props.className">
        <template v-if="props.previewUrl">
            <div v-if="props.fileType === 'image'" class="flex gap-x-4 items-center">
                <img :src="props.previewUrl" class="w-auto h-16 rounded-lg" />
                <audioPlayerWithWave v-if="props.fileType === 'audio'" :src="props.previewUrl" />
                <div class="flex flex-col gap-y-2">
                    <p class="mb-0">{{ $t('file.' + props.fileType + '.current') }}</p>
                    <button type="button" class="btn btn-sm btn-light" @click="props.onChange">{{ $t('file.change_file')
                        }}</button>
                </div>
            </div>

            <div v-else-if="props.fileType === 'audio'" class="flex justify-center flex-col gap-y-2">
                <audioPlayerWithWave :src="props.previewUrl" />
                <p class="mb-0 text-center">{{ $t('file.' + props.fileType + '.current') }}</p>
                <button type="button" class="btn btn-sm btn-light mx-auto" @click="props.onChange">{{ $t('file.change_file')
                    }}</button>
            </div>
        </template>
    </div>
</template>

<script setup>
import audioPlayerWithWave from './audioPlayerWithWave.vue';

const props = defineProps({
    fileType: {
        type: String,
        required: true
    },
    previewUrl: {
        type: String,
        required: true
    },
    className: {
        type: String,
        required: false
    },
    onChange: {
        type: Function,
        required: true
    }
});
</script>