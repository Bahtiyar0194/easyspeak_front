<template>
  <div class="custom-grid">
    <roleProvider :roles="[1, 2, 3, 4]">
      <div class="col-span-12">
        <div class="btn-wrap">
          <button
            class="btn btn-outline-primary"
            @click="addModalIsVisible = true"
          >
            <i class="pi pi-plus"></i>
            {{ $t("pages.conference.create") }}
          </button>
        </div>
      </div>
    </roleProvider>

    <div class="col-span-12">
      <div v-if="conferences.length > 0" class="custom-grid">
        <div
          v-for="conference in conferences"
          :key="conference.uuid"
          class="col-span-12 lg:col-span-6"
        >
          <currentConferenceCard
            :conference="conference"
            :openDeleteModal="openDeleteModal"
            :timeIsUp="timeIsUp"
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
      <h4>{{ $t("pages.conference.create_conference") }}</h4>
    </template>
    <template v-slot:body_content>
      <subscription
        v-if="
          schoolStore.schoolData && schoolStore.schoolData.subscription_expired
        "
      />
      <p v-else-if="conferences.length > 0" class="mb-0">
        {{ $t("pages.conference.you_cant_create_a_conference") }}
      </p>
      <form
        class="mt-2"
        v-else
        @submit.prevent="addConferenceSubmit"
        ref="addFormRef"
      >
        <conferenceStructureForm ref="childRef" :attributes="attributes" />
      </form>
    </template>
  </modal>

  <modal
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
  </modal>
</template>

<script setup>
import { useRouter } from "nuxt/app";
import conferenceStructureForm from "../conferenceStructureForm.vue";
import currentConferenceCard from "../currentConferenceCard.vue";
import modal from "../../ui/modal.vue";
import subscription from "../../ui/subscription.vue";
import loader from "../../ui/loader.vue";
import alert from "../../ui/alert.vue";
import roleProvider from "../../ui/roleProvider.vue";

const router = useRouter();
const errors = ref([]);
const { $axiosPlugin } = useNuxtApp();
const schoolStore = useSchoolStore();
const attributes = ref([]);
const pending = ref(true);
const pendingAdd = ref(false);
const pendingDelete = ref(false);

const addFormRef = ref(null);
const childRef = ref(null);

const conferences = ref([]);
const conference = ref(null);

const addModalIsVisible = ref(false);
const deleteModalIsVisible = ref(false);

const getConferences = async () => {
  pending.value = true;
  await $axiosPlugin
    .get("conferences/get_current_conferences")
    .then((response) => {
      conferences.value = response.data;
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
    getConferences();
  }, 1000);
};

const addConferenceSubmit = async () => {
  pendingAdd.value = true;
  const formData = new FormData(addFormRef.value);
  formData.append("operation_type_id", 27);
  await $axiosPlugin
    .post("conferences/create", formData)
    .then((response) => {
      pendingAdd.value = false;
      closeAddModal();
      getConferences();
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
  pendingDelete.value = true;
  const formData = new FormData();
  formData.append("operation_type_id", 29);
  await $axiosPlugin
    .post("conferences/delete/" + conference.value.uuid, formData)
    .then((response) => {
      pendingDelete.value = false;
      closeDeleteModal();
      getConferences();
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          pendingDelete.value = false;
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

const getConferenceAttributes = async () => {
  pending.value = true;
  await $axiosPlugin
    .get("conferences/get_attributes")
    .then((response) => {
      attributes.value = response.data;
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

const closeAddModal = () => {
  addModalIsVisible.value = false;
  if (childRef.value) {
    childRef.value.resetForm();
  }
  pendingAdd.value = false;
};

const openDeleteModal = (conf) => {
  conference.value = conf;
  deleteModalIsVisible.value = true;
};

const closeDeleteModal = () => {
  deleteModalIsVisible.value = false;
  pendingDelete.value = false;
  conference.value = null;
};

onMounted(() => {
  getConferenceAttributes();
  getConferences();
});
</script>
