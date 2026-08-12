<template>
    <div class="flex relative gap-x-1 items-center border border-inactive py-1 pl-1 pr-2 rounded-3xl text-[14px] cursor-pointer duration-200 hover:bg-blue-500 hover:text-white" :class="{
        'pointer-events-none': selectable === false
    }">
        <userAvatar :padding="0.5" :className="'w-5 h-5 text-[10px]'" :user="props.user" />
        <span>{{ props.user.last_name }} {{ props.user.first_name }}</span>
        <button class="absolute -right-1 -top-1 bg-danger text-white w-3 h-3 flex justify-center items-center rounded-full pointer-events-auto" v-if="props.closable" type="button" :title="$t('delete')" @click="deleteUser(props.user.user_id)">
            <i class="pi pi-times text-[8px]"></i>
        </button>
    </div>
</template>
<script setup>
import userAvatar from './userAvatar.vue';

const props = defineProps({
    user: {
        type: Object,
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
    selectable: {
        type: Boolean,
        default: false,
        required: false
    }
});

const deleteUser = (user_id) => {
    if (props.onDelete) {
        props.onDelete(user_id);
    }
};
</script>