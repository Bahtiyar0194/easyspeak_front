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
      <template v-if="conferences.length > 0"> sdf </template>

      <alert v-else :className="'light'">
        <loader v-if="pending" :className="'overlay'" />
        <p class="mb-0">{{ $t("nothing_was_found_for_your_query") }}</p>
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
      <subscription v-if="school?.subscription_expired" />
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
</template>

<script setup>
import { useRouter } from "nuxt/app";
import conferenceStructureForm from "../conferenceStructureForm.vue";
import modal from "../../ui/modal.vue";
import subscription from "../../ui/subscription.vue";
import loader from "../../ui/loader.vue";
import alert from "../../ui/alert.vue";
import userAvatar from "../../ui/userAvatar.vue";
import pagination from "../../ui/pagination.vue";
import { debounceHandler } from "../../../utils/debounceHandler";
import roleProvider from "../../ui/roleProvider.vue";
import sortTableHead from "../../ui/sortTableHead.vue";

const router = useRouter();
const errors = ref([]);
const { $axiosPlugin, $schoolPlugin } = useNuxtApp();
const attributes = ref([]);
const pending = ref(true);
const pendingAdd = ref(false);

const addFormRef = ref(null);
const childRef = ref(null);

const authUser = useSanctumUser();
const { refreshIdentity } = useSanctumAuth();
const conferences = ref([]);
const conference = ref(null);
const school = $schoolPlugin;

const addModalIsVisible = ref(false);

const getConferences = async (url) => {
  pending.value = true;

  await $axiosPlugin
    .post(url, formData)
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

const addConferenceSubmit = async () => {
  pendingAdd.value = true;
  const formData = new FormData(addFormRef.value);
  formData.append("operation_type_id", 27);
  await $axiosPlugin
    .post("conferences/create", formData)
    .then((response) => {
      pendingAdd.value = false;
      if (childRef.value) {
        childRef.value.resetForm();
      }
      closeAddModal();
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          pendingInvite.value = false;
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
  pendingAdd.value = false;
};

onMounted(() => {
  getConferenceAttributes();
  //   getUsers();
});
</script>
