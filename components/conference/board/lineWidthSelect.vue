<template>
    <div class="flex gap-1">
        <button v-for="width in widths" :key="width" @click="selectWidth(width)"
            class="min-w-8 min-h-8 flex justify-center items-center rounded-lg duration-200"
            :class="(width === currentWidth) ? 'border-active' : 'border-inactive'">
            <span class="rounded-full"
                :class="(tool_name === 'eraser' ? 'border-inactive' : ((currentColor != '#FFFFFF' && currentColor != '#FFFFFF00') ? `border-[${currentColor}]` : 'border-inactive'))"
                :style="{ width: (width + 'px'), height: (width + 'px'), 'backgroundColor': tool_name === 'eraser' ? 'transparent' : currentColor }"></span>
        </button>
    </div>
</template>
<script setup>
import { watch, ref } from 'vue';
import { widths } from '../../../utils/widths';

const props = defineProps({
    width: {
        type: Number,
        required: true
    },
    onSelect: {
        type: Function,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    tool_name: {
        type: String,
        required: true
    }
});

const currentWidth = ref(props.width);
const currentColor = ref(props.color);

watch(() => props.width, (newVal) => {
    currentWidth.value = newVal;
});

watch(() => props.color, (newVal) => {
    currentColor.value = newVal;
});

const selectWidth = (width) => {
    currentWidth.value = width;
    if (props.onSelect) {
        props.onSelect(width);
    }
};
</script>