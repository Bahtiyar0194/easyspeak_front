<template>
  <loader v-if="pending" :className="'full-overlay'" />
  <div class="h-full flex justify-center items-center px-4">
    <div class="flex justify-center items-center">
      <div class="flex flex-col justify-center items-center text-center">
        <h1 class="text-corp mb-2">EasySpeak</h1>
        <h4>
          {{ $t("welcome") }} {{ $t("you_are_on_the_main_page") }}😊
        </h4>
        <nuxt-link
          class="btn btn-sm btn-outline-primary"
          :to="localePath('/dashboard')"
        >
          <i class="pi pi-sign-in"></i>
          {{ $t("pages.dashboard.go_to_dashboard") }}
        </nuxt-link>
      </div>
    </div>
  </div>
</template>
<script setup>
import loader from "../components/ui/loader.vue";
import { onMounted } from "vue";
const pending = ref(true);

onMounted(() => {
  pending.value = false;
});
</script>
