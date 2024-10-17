<template>
    <div class="col-span-12">
        <div v-if="status">
            <h1 class="mb-2 text-6xl">{{ status }}</h1>
            <p class="text-active text-lg">{{ $t("errors.statuses.status_" + status) }}</p>
        </div>
        <h4 v-else class="mb-2 text-3xl">{{ $t("errors.server.error") }}</h4>

        <div v-if="message && showMessage" class="w-full overflow-hidden bg-inactive p-4 text-justify rounded-md mb-4">
            <p class="break-all">{{ message }}</p>
            <p v-if="url" class="text-danger break-all">{{ url }}</p>
        </div>


        <div class="flex gap-4 justify-center max-md:flex-wrap">
            <button v-if="message" class="btn btn-light" @click="showMessage = !showMessage">
                {{ showMessage === true ? $t("errors.hide_error") : $t("errors.show_error") }}
            </button>

            <nuxt-link v-if="status != 400" :to="localePath('/')" class="btn btn-outline-primary">
                {{ $t('pages.home.to') }}
            </nuxt-link>
        </div>
    </div>
</template>
<script setup>
import { useRoute } from 'nuxt/app';
const { t } = useI18n();

useHead({
    title: t('an_error_occurred'),
    meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
    layout: "error"
});

const router = useRoute();
const { status, message, url } = router.query;
const showMessage = ref(false);
</script>