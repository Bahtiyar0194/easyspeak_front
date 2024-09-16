<template>
    <div class="flex flex-wrap gap-1">
        <div class="form-group-border select active w-full">
            <i class="bi bi-type"></i>
            <select @change="selectFontSize($event)">
                <option v-for="size in fontSizes" :key="size" :value="size" :selected="currentFontSize === size">{{ size }}</option>
            </select>
            <label>{{ $t('board.font_size') }}</label>
        </div>

        <!-- <button class="btn btn-square btn-light">
            <i class="bi bi-type-bold"></i>
        </button>

        <button class="btn btn-square btn-light">
            <i class="bi bi-type-italic"></i>
        </button>

        <button class="btn btn-square btn-light">
            <i class="bi bi-type-underline"></i>
        </button>

        <button class="btn btn-square btn-light">
            <i class="bi bi-type-strikethrough"></i>
        </button> -->
    </div>
</template>
<script setup>
import { watch, ref } from 'vue';
import { fontSizes } from '../../../utils/fontSizes';

const props = defineProps({
    size: {
        type: String,
        required: true
    },
    onSelect: {
        type: Function,
        required: true
    }
});

const currentFontSize = ref(props.size);

watch(() => props.width, (newVal) => {
    currentFontSize.value = newVal;
});

const selectFontSize = (event) => {
    const selectedValue = event.target.value;
    currentFontSize.value = selectedValue;
    if (props.onSelect) {
        props.onSelect(selectedValue);
    }
};
</script>