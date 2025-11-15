<template>
  <client-only>
    <div class="col-span-12">
      <h3 class="mb-0">
        🚀 {{ authUser?.first_name }},
        <span class="lowercase">{{ $t("welcome") }}</span>
      </h3>
    </div>

    <roleProvider :roles="[1, 2, 3]">
      <div
        v-if="schoolStore.schoolData"
        class="col-span-12 md:col-span-6 lg:col-span-3"
      >
        <div class="card p-6">
          <h4 class="mb-2">{{ $t("pages.users.title") }}</h4>
          <div class="flex gap-6 flex-wrap">
            <div class="flex flex-col gap-1">
              <span class="text-inactive">{{ $t("all") }}:</span>

              <span class="font-bold text-4xl text-corp">
                <animatedNumber
                  :number="schoolStore.schoolData.all_users_count"
                />
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-inactive">{{ $t("active") }}:</span>

              <span class="font-bold text-4xl text-success">
                <animatedNumber
                  :number="schoolStore.schoolData.active_users_count"
                />
              </span>
            </div>
          </div>
        </div>
      </div>
    </roleProvider>
  </client-only>
</template>

<script setup>
import animatedNumber from "../../components/ui/animatedNumber.vue";
import roleProvider from "../../components/ui/roleProvider.vue";
const { t } = useI18n();
const error = ref(false);
const authUser = useSanctumUser();
const schoolStore = useSchoolStore();

useHead({
  title: t("pages.dashboard.title"),
  meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});
</script>
