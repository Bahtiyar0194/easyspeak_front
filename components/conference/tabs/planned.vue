<template>
  <div class="custom-grid">
    <roleProvider :roles="[1, 2, 3, 4, 6]">
      <div class="col-span-12">
        <div class="list-toolbar">
          <button
            type="button"
            class="btn btn-primary ml-auto"
            @click="addModalIsVisible = true"
          >
            <i class="pi pi-calendar-plus" aria-hidden="true"></i>
            {{ $t("pages.conference.plan") }}
          </button>
        </div>
      </div>
    </roleProvider>

    <!-- Календарь грузит расписание помесячно сам (@range). Пустые дни видны
         в календаре, в режиме «День» — своё «нет занятий» -->
    <div class="col-span-12 relative">
      <scheduleGrid
        :schedule="schedule"
        :pendingSchedule="pendingSchedule"
        :rangeLoaded="scheduleHasData"
        :monthCounts="monthCounts"
        :openEventModal="null"
        @range="setScheduleRange"
      />
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
      <h4>{{ $t("pages.conference.plan_alt") }}</h4>
    </template>
    <template v-slot:body_content>
      <form class="mt-2" @submit.prevent="addConferenceSubmit" ref="addFormRef">
        <conferenceStructureForm
          ref="childRef"
          :attributes="attributes"
          :mode="mode"
          :errors="errors"
        />
      </form>
    </template>
  </modal>

  <!-- <modal
    :show="deleteModalIsVisible"
    :onClose="() => closeDeleteModal()"
    :className="'modal-lg'"
    :showLoader="pendingDelete"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("pages.conference.delete_conference") }}</h4>
    </template>
    <template v-slot:body_content>
      <p>{{ $t("pages.conference.delete_confirm") }}</p>
      <div class="btn-wrap justify-end mt-4">
        <button
          @click="deleteConferenceSubmit()"
          class="btn btn-outline-danger"
        >
          <i class="pi pi-trash"></i>
          {{ $t("yes") }}
        </button>
        <button @click="deleteModalIsVisible = false" class="btn btn-light">
          <i class="pi pi-ban"></i>
          {{ $t("no") }}
        </button>
      </div>
    </template>
  </modal> -->
</template>

<script setup>
import { useRouter } from "nuxt/app";
import currentConferenceCard from "../currentConferenceCard.vue";
import roleProvider from "../../ui/roleProvider.vue";
import modal from "../../ui/modal.vue";
import loader from "../../ui/loader.vue";
import emptyState from "~/components/ui/emptyState.vue";
import scheduleGrid from "../../schedule/scheduleGrid.vue";
import {
  onConferencesChanged,
  checkConferenceLiveNow,
} from "~/composables/useConferenceLive";
import { useScheduleLoader } from "~/composables/useScheduleLoader";

const router = useRouter();
const errors = ref([]);
const { $axiosPlugin } = useNuxtApp();
const schoolStore = useSchoolStore();
const pendingAdd = ref(false);
const pendingDelete = ref(false);

const mode = "plan";

const addFormRef = ref(null);
const childRef = ref(null);

// const conference = ref(null);

const addModalIsVisible = ref(false);
// const deleteModalIsVisible = ref(false);

const props = defineProps({
  attributes: {
    type: Object,
    required: true,
  },
});

const { attributes } = toRefs(props);

let scheduleLoadedAt = 0;

// Расписание грузится помесячно — только то, что видно в календаре
const {
  schedule,
  pending: pendingSchedule,
  hasData: scheduleHasData,
  monthCounts,
  setRange: setScheduleRange,
  refresh: refreshSchedule,
} = useScheduleLoader({
  onError: (err) => {
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
  },
});

// Перезагрузить видимый период. silent — фоновое обновление: ошибки не
// уводят на страницу ошибки
const getSchedule = async (silent = false) => {
  await refreshSchedule({ silent });
  scheduleLoadedAt = Date.now();
};

const timeIsUp = () => {
  setTimeout(() => {
    getSchedule();
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
      getSchedule();
      // Урок может начаться в ближайшие минуты — обновим меню и «Текущие» сразу
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

// const deleteConferenceSubmit = async () => {
//   pendingDelete.value = true;
//   const formData = new FormData();
//   formData.append("operation_type_id", 29);
//   await $axiosPlugin
//     .post("conferences/delete/" + conference.value.uuid, formData)
//     .then((response) => {
//       pendingDelete.value = false;
//       closeDeleteModal();
//       getSchedule();
//     })
//     .catch((err) => {
//       if (err.response) {
//         if (err.response.status == 422) {
//           errors.value = err.response.data;
//           pendingDelete.value = false;
//         } else {
//           router.push({
//             path: "/error",
//             query: {
//               status: err.response.status,
//               message: err.response.data.message,
//               url: err.request.responseURL,
//             },
//           });
//         }
//       } else {
//         router.push("/error");
//       }
//     });
// };

const closeAddModal = () => {
  addModalIsVisible.value = false;
  errors.value = [];
  if (childRef.value) {
    childRef.value.resetForm();
  }
  pendingAdd.value = false;
};

// const openDeleteModal = (conf) => {
//   conference.value = conf;
//   deleteModalIsVisible.value = true;
// };

// const closeDeleteModal = () => {
//   deleteModalIsVisible.value = false;
//   pendingDelete.value = false;
//   conference.value = null;
// };

// Урок начался/закончился, создан, перенесён или удалён — меню
// (layouts/dashboard.vue) замечает это при опросе, и расписание обновляется само
onConferencesChanged(() => {
  if (pendingSchedule.value || pendingAdd.value) return;
  // Только что загрузили сами (например, после создания) — расписание свежее
  if (Date.now() - scheduleLoadedAt < 5000) return;
  getSchedule(true);
});
</script>
