<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <div class="list-toolbar">
        <span v-if="conferences.length" class="lesson-badge live">
          <span class="live-dot !w-2 !h-2" aria-hidden="true"></span>
          {{ $t("pages.dashboard.live_now") }}: {{ conferences.length }}
        </span>
        <roleProvider :roles="[1, 2, 3, 4]">
          <button
            type="button"
            class="btn btn-primary ml-auto"
            @click="addModalIsVisible = true"
          >
            <i class="pi pi-video" aria-hidden="true"></i>
            {{ $t("pages.conference.create") }}
          </button>
        </roleProvider>
      </div>
    </div>

    <div class="col-span-12">
      <div v-if="conferences.length > 0" class="custom-grid">
        <div
          v-for="conference in conferences"
          :key="conference.uuid"
          class="col-span-12"
          :class="{ '2xl:col-span-6': conferences.length > 1 }"
        >
          <currentConferenceCard
            :conference="conference"
            :openDeleteModal="openDeleteModal"
            :timeIsUp="timeIsUp"
          />
        </div>
      </div>

      <emptyState
        v-else
        :pending="pending"
        :text="$t('pages.conference.no_current_title')"
        :hint="$t('pages.conference.no_current_hint')"
        image="/images/calendar-search.svg"
      >
        <roleProvider :roles="[1, 2, 3, 4]">
          <button
            type="button"
            class="btn btn-primary"
            @click="addModalIsVisible = true"
          >
            <i class="pi pi-video" aria-hidden="true"></i>
            {{ $t("pages.conference.create") }}
          </button>
        </roleProvider>
        <nuxt-link class="btn btn-light" :to="localePath('/dashboard/schedule')">
          <i class="pi pi-calendar-clock" aria-hidden="true"></i>
          {{ $t("pages.schedule.title") }}
        </nuxt-link>
      </emptyState>
    </div>
  </div>

  <modal
    :show="addModalIsVisible"
    :onClose="() => closeAddModal()"
    :className="'modal-lg'"
    :showLoader="pendingAdd"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("pages.conference.create_conference") }}</h4>
    </template>
    <template v-slot:body_content>
      <subscription
        v-if="
          schoolStore.schoolData && schoolStore.schoolData.subscription_expired
        "
      />
      <div v-else-if="conferences.length > 0" class="db-notice">
        <div class="db-notice-icon" aria-hidden="true">
          <i class="pi pi-info"></i>
        </div>
        <p class="mb-0 flex-1">
          {{ $t("pages.conference.you_cant_create_a_conference") }}
        </p>
      </div>
      <form
        class="mt-2"
        v-else
        @submit.prevent="addConferenceSubmit"
        ref="addFormRef"
      >
        <conferenceStructureForm
          ref="childRef"
          :attributes="attributes"
          :mode="mode"
          :errors="errors"
        />
      </form>
    </template>
  </modal>

</template>

<script setup>
import { useRouter } from "nuxt/app";
import conferenceStructureForm from "../conferenceStructureForm.vue";
import currentConferenceCard from "../currentConferenceCard.vue";
import modal from "../../ui/modal.vue";
import subscription from "../../ui/subscription.vue";
import loader from "../../ui/loader.vue";
import emptyState from "~/components/ui/emptyState.vue";
import roleProvider from "../../ui/roleProvider.vue";
import { useConfirm } from "~/composables/useConfirm";
import {
  onConferencesChanged,
  checkConferenceLiveNow,
} from "~/composables/useConferenceLive";

const router = useRouter();
const { t } = useI18n();
const confirm = useConfirm();
const errors = ref([]);
const { $axiosPlugin } = useNuxtApp();
const schoolStore = useSchoolStore();
const pending = ref(true);
const pendingAdd = ref(false);
const pendingDelete = ref(false);

const mode = "current";

const addFormRef = ref(null);
const childRef = ref(null);

const conferences = ref([]);
const conference = ref(null);

const addModalIsVisible = ref(false);

const props = defineProps({
  attributes: {
    type: Object,
    required: true,
  },
});

const { attributes } = toRefs(props);

let conferencesLoadedAt = 0;

// silent — фоновое обновление: без лоадера, ошибки не уводят на страницу ошибки
const getConferences = async (silent = false) => {
  if (!silent) pending.value = true;
  await $axiosPlugin
    .get("conferences/get_current_conferences")
    .then((response) => {
      conferences.value = response.data;
      conferencesLoadedAt = Date.now();
      pending.value = false;
    })
    .catch((err) => {
      if (silent) return;
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

const timeIsUp = () => {
  setTimeout(() => {
    getConferences();
  }, 1000);
};

const addConferenceSubmit = async () => {
  if (pendingAdd.value) return;
  pendingAdd.value = true;
  const formData = new FormData(addFormRef.value);
  formData.append("operation_type_id", 27);
  formData.append("mode", mode);
  await $axiosPlugin
    .post("conferences/create", formData)
    .then((response) => {
      pendingAdd.value = false;
      closeAddModal();
      getConferences();
      // Точка «идёт конференция» в меню — сразу, без ожидания опроса
      checkConferenceLiveNow();
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          pendingAdd.value = false;
        } else {
          router.push({
            path: "/error",
            query: {
              status: err.response.status,
              message: err.response.data.message,
              url: err.request.responseURL,
            },
          });
        }
      } else {
        router.push("/error");
      }
    });
};

const deleteConferenceSubmit = async () => {
  if (pendingDelete.value) return;
  pendingDelete.value = true;
  pending.value = true;
  const formData = new FormData();
  formData.append("operation_type_id", 29);
  await $axiosPlugin
    .post("conferences/delete/" + conference.value.uuid, formData)
    .then(() => {
      pendingDelete.value = false;
      conference.value = null;
      getConferences();
      checkConferenceLiveNow();
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          pendingDelete.value = false;
          pending.value = false;
        } else {
          router.push({
            path: "/error",
            query: {
              status: err.response.status,
              message: err.response.data.message,
              url: err.request.responseURL,
            },
          });
        }
      } else {
        router.push("/error");
      }
    });
};

const closeAddModal = () => {
  addModalIsVisible.value = false;
  errors.value = [];
  if (childRef.value) {
    childRef.value.resetForm();
  }
  pendingAdd.value = false;
};

// Удаление — через общее окно подтверждения
const openDeleteModal = async (conf) => {
  const ok = await confirm({
    title: t("pages.conference.delete_conference"),
    message: t("pages.conference.delete_confirm"),
    confirmText: t("delete"),
    danger: true,
  });
  if (!ok) return;
  conference.value = conf;
  deleteConferenceSubmit();
};

onMounted(() => {
  getConferences();
});

// Урок начался/закончился, создан или удалён — меню (layouts/dashboard.vue)
// замечает это при опросе раз в 30 секунд, и список обновляется сам.
// Пока идёт загрузка или удаление — не вмешиваемся.
onConferencesChanged(() => {
  if (pending.value || pendingDelete.value) return;
  // Только что загрузили сами (например, после создания) — список уже свежий
  if (Date.now() - conferencesLoadedAt < 5000) return;
  getConferences(true);
});
</script>
