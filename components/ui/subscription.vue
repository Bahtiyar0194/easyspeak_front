<template>
  <alert :className="'primary'">
    <div class="flex flex-col gap-4 items-center">
      <p class="text-center font-bold mb-0">{{ $t("pages.subscription.expired") }}</p>

      <nuxt-link class="btn btn-primary" to="/dashboard/school?prolongation=true">
        {{ $t("pages.subscription.prolongation") }}
      </nuxt-link>
    </div>
  </alert>
</template>
<script setup>
import alert from "./alert.vue";
</script>
