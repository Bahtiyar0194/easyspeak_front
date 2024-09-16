<template>
    <div class="grid grid-cols-12 gap-1">
        <button v-for="color in colors" :key="color" @click="selectColor(color)"
            class="w-5 h-5 flex justify-center items-center rounded-full"
            :class="((color != '#FFFFFF' && color != '#FFFFFF00') ? `border-[${color}]` : 'border-inactive ') + (color === '#FFFFFF00' && 'checkered')"
            :style="{ 'backgroundColor': color }">
            <span v-if="currentColor === color" class="w-1.5 h-1.5 rounded-full"
                :class="(color === '#FFFFFF' || color === '#FFFFFF00') ? 'bg-black' : 'bg-white'"></span>
        </button>
    </div>
</template>
<script setup>
import { watch, ref } from 'vue';
import { colors } from '../../../utils/colors';

const props = defineProps({
    color: {
        type: String,
        required: true
    },
    onSelect: {
        type: Function,
        required: true
    }
});

const currentColor = ref(props.color)

watch(() => props.color, (newVal) => {
    currentColor.value = newVal;
});

const selectColor = (color) => {
    currentColor.value = color;
    if (props.onSelect) {
        props.onSelect(color);
    }
};
</script>

<style scoped>
.checkered{
    background-image: url("data:image/svg+xml,%0A%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='%23F0F0F0' d='M0 0h2v2H0zm2 2h2v2H2z'/%3E%3C/svg%3E");
    background-size: 4px 4px;
    background-repeat: repeat;
}
</style>