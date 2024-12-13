<template>
    <div class=" select-none flex relative gap-x-1 items-center border py-1.5 px-2 rounded-lg text-[14px]"
        :class="props.colorClass ? ('border-' + props.colorClass) : 'border-inactive'">
        <span :class="props.colorClass && ('text-' + props.colorClass)">{{ props.itemLabel }}</span>
        <button
            class="absolute -right-1 -top-1 bg-danger text-white w-3 h-3 flex justify-center items-center rounded-full"
            v-if="props.closable" type="button" :title="$t('delete')" @click="deleteItem(props.itemId)">
            <i class="pi pi-times text-[8px]"></i>
        </button>
    </div>
</template>
<script setup>
const props = defineProps({
    itemId: {
        type: Number,
        required: false
    },
    itemLabel: {
        type: String,
        required: true
    },
    onDelete: {
        type: Function,
        required: false
    },
    closable: {
        type: Boolean,
        required: false
    },
    colorClass: {
        required: false,
        type: String
    }
});

const deleteItem = (itemId) => {
    if (props.onDelete) {
        props.onDelete(itemId);
    }
};
</script>