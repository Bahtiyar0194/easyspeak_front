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
          <div class="card p-4">
            <div class="custom-grid">
              <div class="col-span-12">
                <h3>
                  {{ conference.lesson_name }}
                </h3>

                <p class="text-inactive">
                  <i class="pi pi-book"></i> {{ $t("pages.courses.course") }}:
                  <span class="text-active"
                    >{{ conference.course_name }} -
                    {{ conference.level_name }}</span
                  >
                </p>
                <p class="text-inactive">
                  <i class="pi pi-users"></i> {{ $t("pages.groups.group") }}:
                  <span class="text-active">{{ conference.group_name }}</span>
                </p>
                <p class="text-inactive">
                  <i class="pi pi-user"></i> {{ $t("mentor") }}:
                  <span class="text-active"
                    >{{ conference.mentor_last_name }}
                    {{ conference.mentor_first_name }}</span
                  >
                </p>
                <p class="text-inactive">
                  <i class="pi pi-clock"></i> {{ $t("start_time") }}:
                  <span class="text-active">{{
                    conference.start_time_formatted
                  }}</span>
                </p>
                <p class="text-inactive">
                  <i class="pi pi-clock"></i> {{ $t("end_time") }}:
                  <span class="text-active">{{
                    conference.end_time_formatted
                  }}</span>
                </p>

                <p class="text-inactive mb-0">
                  <i class="pi pi-clock"></i> {{ $t("remaining_time") }}:
                  <span class="text-danger">
                    <countdownTimer
                      :endDate="conference.end_time"
                      :onComplete="() => timeIsUp()"
                    />
                  </span>
                </p>
              </div>
              <div class="col-span-12">
              <p>
                {{ $t("pages.groups.members") }}:
                <b>{{ conference.members.length }}</b>
              </p>

              <div v-if="conference.members.length > 0" class="btn-wrap">
                <userTag
                  v-for="(member, index) in conference.members"
                  :key="index"
                  :user="member"
                  :closable="false"
                />
              </div>
            </div>
            <div class="col-span-12">
              <nuxt-link
                class="btn btn-outline-success animate-pulse-glow"
                :to="localePath('/dashboard/conference/' + conference.uuid)"
              >
                <i class="pi pi-video"></i>
                {{ $t("pages.conference.join") }}
              </nuxt-link>
            </div>
            </div>
          </div>
        </div>
      </div>

      <alert v-else :className="'light'">
        <loader v-if="pending" :className="'overlay'" />
        <p class="mb-0">{{ $t("pages.conference.no_current_conferences") }}</p>
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
import countdownTimer from "../../ui/countdownTimer.vue";
import userAvatar from "../../ui/userAvatar.vue";
import pagination from "../../ui/pagination.vue";
import { debounceHandler } from "../../../utils/debounceHandler";
import roleProvider from "../../ui/roleProvider.vue";
import sortTableHead from "../../ui/sortTableHead.vue";
import userTag from "../../ui/userTag.vue";

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
      if (childRef.value) {
        childRef.value.resetForm();
      }
      closeAddModal();
      getConferences();
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
  getConferences();
});
</script>
