<template>
  <div class="col-span-12">
    <div class="page-head">
      <h2 class="page-title">
        <i class="bi bi-camera-video text-corp" aria-hidden="true"></i>
        {{ $t("pages.conference.title") }}
      </h2>
    </div>
  </div>
  <client-only>
    <tabs :tabs="tabs_data" />

    <!-- Пока вкладки не отрисованы на клиенте — скелетон вкладок и карточки
         (раньше страницу закрывал полноэкранный лоадер) -->
    <template #fallback>
      <div class="col-span-12 flex flex-col gap-4" aria-hidden="true">
        <div class="flex gap-2">
          <div class="skeleton h-10 w-32 !rounded-xl"></div>
          <div class="skeleton h-10 w-36 !rounded-xl"></div>
        </div>
        <conferenceCardSkeleton />
      </div>
    </template>
  </client-only>
</template>
<script setup>
const { t } = useI18n();

useHead({
  title: t("pages.conference.title"),
  meta: [{ name: "description", content: t("pages.home.description") }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

import tabs from "../../../components/ui/tabs.vue";
import current from "../../../components/conference/tabs/current.vue";
import planned from "../../../components/conference/tabs/planned.vue";
import conferenceCardSkeleton from "../../../components/conference/conferenceCardSkeleton.vue";

import { onMounted } from "vue";
import { useRouter } from "nuxt/app";

const { $axiosPlugin } = useNuxtApp();
// Раньше router не был объявлен — при ошибке загрузки страница падала
const router = useRouter();

// Атрибуты нужны только форме создания конференции — списки показываем
// сразу, а форма покажет лоадер, если её откроют раньше, чем они пришли
const attributesPending = ref(true);
const attributes = ref([]);

const tabs_data = computed(() => [
  {
    name: "current",
    title: t("pages.conference.statuses.current"),
    icon: "bi bi-broadcast",
    component: current,
    props: {
      attributes,
      attributesPending,
    },
  },
  {
    name: "planned",
    title: t("pages.conference.statuses.planned"),
    icon: "bi bi-calendar2-event",
    component: planned,
    props: {
      attributes,
      attributesPending,
    },
  },
  // {
  //     name: 'passed',
  //     title: t('pages.conference.statuses.passed'),
  //     icon: 'bi bi-check2-square'
  // },
]);

const getConferenceAttributes = async () => {
  await $axiosPlugin
    .get("conferences/get_attributes")
    .then((response) => {
      attributes.value = response.data;
      attributesPending.value = false;
    })
    .catch((err) => {
      if (err.response) {
        router.push({
          path: "/error",
          query: {
            status: err.response.status,
            message: err.response.data.message,
            url: err.request.responseURL,
          },
        });
      } else {
        router.push("/error");
      }
    });
};

onMounted(() => {
  getConferenceAttributes();
});
</script>
