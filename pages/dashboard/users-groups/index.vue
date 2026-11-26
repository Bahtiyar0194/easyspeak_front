<template>
  <client-only>
    <tabs
      :tabs="tabs_data"
      :showTabHeader="schoolStore.isAiSchoolDomain === false"
    />

    <!-- Пока вкладки не отрисованы на клиенте — скелетон той же формы
         (раньше страницу закрывал полноэкранный лоадер) -->
    <template #fallback>
      <div class="col-span-12 flex flex-col gap-4">
        <div
          v-if="schoolStore.isAiSchoolDomain === false"
          class="flex gap-2"
          aria-hidden="true"
        >
          <div class="skeleton h-10 w-36 !rounded-xl"></div>
          <div class="skeleton h-10 w-28 !rounded-xl"></div>
        </div>
        <div class="flex items-center gap-3" aria-hidden="true">
          <div class="skeleton h-10 w-28 !rounded-xl"></div>
          <div class="skeleton h-4 w-24"></div>
          <div class="skeleton h-10 w-36 !rounded-xl ml-auto"></div>
        </div>
        <listSkeleton :columns="5" />
      </div>
    </template>
  </client-only>
</template>
<script setup>
import tabs from "../../../components/ui/tabs.vue";
import users from "../../../components/users-groups/tabs/users.vue";
import groups from "../../../components/users-groups/tabs/groups.vue";
import listSkeleton from "../../../components/ui/listSkeleton.vue";
const { t } = useI18n();
const schoolStore = useSchoolStore();

useHead({
  title: t(
    schoolStore.isAiSchoolDomain
      ? "pages.users.title"
      : "pages.users-groups.title",
  ),
  meta: [{ name: "description", content: t("pages.home.description") }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const tabs_data = computed(() => [
  {
    name: "users",
    title: t("pages.users.title"),
    icon: "pi pi-user",
    component: users,
  },
  {
    name: "groups",
    title: t("pages.groups.title"),
    icon: "pi pi-users",
    component: groups,
  },
]);
</script>
