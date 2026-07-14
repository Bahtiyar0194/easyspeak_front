<template>
  <div class="custom-grid">
    <roleProvider :roles="[1, 2, 3, 4, 6]">
      <div class="col-span-12">
        <div class="btn-wrap">
          <button class="btn btn-primary" @click="addModalIsVisible = true">
            <i class="pi pi-calendar"></i>
            {{ $t("pages.conference.plan") }}
          </button>
        </div>
      </div>
    </roleProvider>

    <div class="col-span-12">
      <div v-if="schedule.length > 0" class="custom-grid">
        <div class="col-span-12 relative">
          <scheduleGrid
            :schedule="schedule"
            :pendingSchedule="pendingSchedule"
            :openEventModal="null"
          />
        </div>
      </div>

      <alert v-else :className="'light'">
        <loader v-if="pending" :className="'overlay'" :showPendingText="true" />
        <img
          class="w-24 mx-auto mb-2"
          src="~/public/images/calendar-search.svg"
        />
        <p class="mb-0">
          <b>{{ $t("pages.conference.no_current_conferences") }}</b>
        </p>
      </alert>
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
import alert from "../../ui/alert.vue";
import scheduleGrid from "../../schedule/scheduleGrid.vue";

const router = useRouter();
const errors = ref([]);
const { $axiosPlugin } = useNuxtApp();
const schoolStore = useSchoolStore();
const pending = ref(true);
const pendingAdd = ref(false);
const pendingDelete = ref(false);
const pendingSchedule = ref(true);

const mode = "plan";

const addFormRef = ref(null);
const childRef = ref(null);

const schedule = ref([]);
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

const getSchedule = async () => {
  pendingSchedule.value = true;
  await $axiosPlugin
    .post("schedule/get")
    .then((response) => {
      schedule.value = response.data;
      pendingSchedule.value = false;
      pending.value = false;
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

const timeIsUp = () => {
  setTimeout(() => {
    getSchedule();
  }, 1000);
};

const addConferenceSubmit = async () => {
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

onMounted(() => {
  getSchedule();
});
</script>
