<template>
  <div class="col-span-12">
    <div class="flex justify-center items-center py-24">
      <div class="flex flex-col justify-center items-center gap-4">
        <client-only>
          <div class="rounded-full p-4 bg-active shadow-xl w-min">
            <i
              class="pi"
              :class="
                route.query.success == 'true'
                  ? 'pi-check-circle text-success'
                  : 'pi-ban text-danger'
              "
              style="font-size: 120px"
            ></i>
          </div>

          <h3 class="mb-0">
            {{
              route.query.success == "true"
                ? $t("pages.payment-result.success")
                : $t("pages.payment-result.fail")
            }}
          </h3>

          <p class="mb-0 text-center" v-if="route.query.message">
            {{ route.query.message }}. {{ $t("errors.error_code") }}:
            <span>{{ route.query.reason }}</span>
          </p>

          <nuxt-link to="/dashboard">{{
            $t("pages.dashboard.go_to_dashboard")
          }}</nuxt-link>
        </client-only>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const { t } = useI18n();
useHead({
  title: t('pages.payment-result.title'),
  meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});
</script>
