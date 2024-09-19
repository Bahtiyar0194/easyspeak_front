<template>
    <div class="rounded-full border-inactive w-fit h-fit" :class="padding ? ('p-' + padding) : 'p-0.5'">
        <div v-if="user.avatar"
            :style="{ 'backgroundImage': 'url(' + API_URL + '/auth/get_avatar/' + user.avatar + ')' }"
            class="bg-cover bg-no-repeat bg-center rounded-full" :class="className ? className : ''">
        </div>

        <div v-else class="rounded-full bg-corp flex items-center justify-center text-white overflow-hidden"
            :class="className ? className : ''">
            {{ user.first_name.substring(0, 1) }}{{ user.last_name.substring(0, 1) }}
        </div>
    </div>
</template>

<script setup>
defineProps({
    user: {
        type: Object,
        required: true
    },
    padding: {
        type: Number,
        required: false
    },
    className: {
        type: String,
        required: false
    }
});
</script>