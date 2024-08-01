<template>
    <div class="rounded-full border-inactive w-fit h-fit" :class="padding ? ('p-' + padding) : 'p-0.5'">
        <div v-if="user_avatar"
            :style="{ 'backgroundImage': 'url(' + API_URL + '/auth/get_avatar/' + user_avatar + ')' }"
            class="bg-cover bg-no-repeat bg-center rounded-full" :class="className ? className : ''">
        </div>

        <div v-else class="rounded-full bg-corp flex items-center justify-center text-white text-xl overflow-hidden"
            :class="className ? className : ''">
            <img class="w-2/3" src="~/public/avatar/default.svg" />
        </div>
    </div>
</template>

<script setup>
defineProps({
    user_avatar: {
        type: String,
        required: false
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