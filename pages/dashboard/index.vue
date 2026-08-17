<template>
  <loader v-if="pending" :className="'full-overlay'" :showPendingText="true" />
  <client-only v-if="dashboard">
    <!-- <div class="col-span-12">
      <h2 class="mb-0">
        🚀 {{ authUser?.first_name }},
        <span class="lowercase">{{ $t("welcome") }}</span>
      </h2>
    </div> -->

    <!-- <roleProvider :roles="[1, 2, 3]">
      <div
        v-if="schoolStore.schoolData && schoolStore.schoolData.all_users_count"
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
    </roleProvider> -->

    <div
      v-if="
        dashboard &&
        authUser &&
        !authUser.telegram &&
        !schoolStore.isAiSchoolDomain
      "
      class="col-span-12"
    >
      <div
        style="
          background-image: linear-gradient(225deg, #3c8ce7 10%, #00eaff 100%);
        "
        class="p-6 rounded-xl overflow-hidden relative"
      >
        <div class="z-10 relative pr-32">
          <h3 class="text-white mb-2">{{ $t("telegram.banner.title") }}</h3>
          <p class="text-white mb-4 font-medium">
            {{ $t("telegram.banner.description") }}
          </p>

          <a
            class="btn btn-white"
            target="_blank"
            :href="`https://t.me/${config.public.telegramBotName}?start=${localeProperties.code}`"
          >
            <i class="pi pi-telegram"></i>
            {{ $t("telegram.connect.connect") }}</a
          >
        </div>

        <img
          class="absolute opacity-30 w-40 top-1/2 -translate-y-1/2 right-4 z-0"
          src="~/public/images/telegram/telegram.png"
        />
      </div>
    </div>

    <div class="col-span-12 lg:col-span-6">
      <aiExplainer :explainMode="'speaking'" />
    </div>

    <div v-if="dashboard" class="col-span-12 lg:col-span-6">
      <div class="custom-grid">
        <div
          v-if="dashboard.current_lessons && dashboard.current_lessons.length"
          class="col-span-12"
        >
          <div class="custom-grid">
            <div class="col-span-12">
              <h3 class="mb-0">📖 {{ $t("pages.lessons.current_lessons") }}</h3>
            </div>
            <div
              v-for="conference in dashboard.current_lessons"
              :key="conference.uuid"
              class="col-span-12"
            >
              <currentConferenceCard
                :conference="conference"
                :timeIsUp="timeIsUp"
              />
            </div>
          </div>
        </div>

        <div class="col-span-12">
          <div class="custom-grid">
            <div class="col-span-12">
              <h3 class="mb-0">
                📅 {{ $t("pages.lessons.upcoming_lessons") }}
              </h3>
            </div>

            <template
              v-if="
                dashboard.upcoming_lessons && dashboard.upcoming_lessons.length
              "
            >
              <div class="col-span-12">
                <scrollFadeContainer :maxHeight="300" :fadeSize="120">
                  <div class="table table-striped table-sm selectable">
                    <table>
                      <thead>
                        <tr>
                          <th>{{ $t("start_time") }}</th>
                          <th>{{ $t("pages.lessons.lesson_name") }}</th>
                          <template v-if="!schoolStore.isAiSchoolDomain">
                            <roleProvider :roles="[1, 2, 3, 4]">
                              <th>{{ $t("pages.lessons.lesson_type") }}</th>
                              <th>{{ $t("pages.groups.group") }}</th>
                              <th>{{ $t("pages.courses.course") }}</th>
                              <th>{{ $t("pages.groups.group_category") }}</th>
                            </roleProvider>
                          </template>
                          <template v-else>
                            <th>{{ $t("pages.courses.title") }}</th>
                          </template>
                          <th>{{ $t("mentor") }}</th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr
                          v-for="e in dashboard.upcoming_lessons"
                          :key="e.uuid"
                          @click="openEventModal(e.uuid)"
                          :class="e.is_active === true ? 'success' : ''"
                        >
                          <td>
                            <b class="text-nowrap">{{
                              e.is_active === true
                                ? $t("already_started")
                                : e.start_time_formatted
                            }}</b>
                            <!-- <br />
                          <b
                            v-if="e.is_bought_status != null"
                            class="text-xs"
                            :class="
                              e.is_bought_status.is_bought === true
                                ? 'text-success'
                                : 'text-danger'
                            "
                            >{{
                              e.is_bought_status.is_bought === true
                                ? e.is_bought_status.is_free
                                  ? $t("pages.lessons.free_lesson")
                                  : $t("pages.payment-result.success_alt")
                                : $t("pages.payment-result.fail_alt_2")
                            }}</b
                          > -->
                          </td>
                          <td v-if="e.lesson_name">
                            {{ e.lesson_name }}
                          </td>
                          <td v-if="e.topic">{{ e.topic }}</td>
                          <template v-if="!schoolStore.isAiSchoolDomain">
                            <roleProvider :roles="[1, 2, 3, 4]">
                              <td>{{ e.lesson_type_name }}</td>
                              <td>{{ e.group_name }}</td>
                              <td>{{ e.course_name }}</td>
                              <td>{{ e.level_name }}</td>
                            </roleProvider>
                          </template>
                          <template v-else>
                            <td>
                              <div class="text-list text-nowrap">
                                <span
                                  v-for="(level, lIndex) in e.levels"
                                  :key="lIndex"
                                >
                                  {{ level.level_name }}
                                </span>
                              </div>
                            </td>
                          </template>
                          <td>
                            <div class="flex gap-x-1 items-center">
                              <userAvatar
                                :padding="0.5"
                                :className="'w-6 h-6'"
                                :user="{
                                  last_name:
                                    e.mentor_last_name ||
                                    e.moderator_last_name ||
                                    '',
                                  first_name:
                                    e.mentor_first_name ||
                                    e.moderator_first_name ||
                                    '',
                                  avatar:
                                    e.mentor_avatar || e.moderator_avatar || '',
                                }"
                              />
                              <span class="text-nowrap">
                                {{
                                  e.mentor_last_name ||
                                  e.moderator_last_name ||
                                  ""
                                }}
                                {{
                                  e.mentor_first_name ||
                                  e.moderator_first_name ||
                                  ""
                                }}</span
                              >
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </scrollFadeContainer>
              </div>

              <div class="col-span-12">
                <div class="btn-wrap justify-end">
                  <!-- <button
                    v-if="paymentLessons.length > 0"
                    @click="openPaymentModal()"
                    class="btn btn-primary"
                  >
                    <i class="pi pi-credit-card"></i>
                    {{ $t("pages.lessons.pay_for_lessons") }}
                  </button> -->
                  <nuxt-link
                    v-if="!schoolStore.isAiSchoolDomain"
                    class="btn btn-light"
                    :to="localePath('/dashboard/schedule')"
                  >
                    <i class="pi pi-calendar-clock"></i>
                    {{ $t("pages.schedule.show_entire_schedule") }}
                  </nuxt-link>
                </div>
              </div>
            </template>
            <div v-else class="col-span-12">
              <alert :className="'light'">
                <img
                  class="w-24 mx-auto mb-2"
                  src="~/public/images/calendar-search.svg"
                />
                <p class="mb-0">
                  <b>{{ $t("pages.lessons.no_upcoming_lessons") }}</b>
                </p>
              </alert>
            </div>
          </div>
        </div>
      </div>
    </div>

    <modal
      :show="eventModalIsVisible"
      :onClose="() => closeEventModal()"
      :className="'modal-xl'"
      :showLoader="pendingEvent"
      :showPendingText="true"
      :closeOnClickSelf="true"
    >
      <template v-slot:header_content>
        <h3>{{ currentEvent?.lesson_name || currentEvent?.topic }}</h3>
      </template>
      <template v-if="currentEvent" v-slot:body_content>
        <canvas id="confetti-canvas"></canvas>
        <div class="custom-grid">
          <template v-if="acceptedConference">
            <div class="col-span-12">
              <h5>{{ $t("pages.conference.accept.success.title") }}</h5>
              <p>
                {{
                  $t("pages.conference.accept.success.description", {
                    conf_name: currentEvent?.topic || "",
                  })
                }}
              </p>
            </div>

            <div class="col-span-12">
              <b>{{ $t("add_to_calendar") }}:</b>
            </div>

            <div class="col-span-12">
              <add-to-calendar-button
                :name="currentEvent?.topic"
                :startDate="currentEvent.date"
                :endDate="currentEvent.date_end"
                :startTime="currentEvent.time"
                :endTime="currentEvent.time_end"
                timeZone="Asia/Almaty"
                :location="conferenceUrl"
                :description="`${$t('pages.conference.accept.success.url_desc_1')} [url]${conferenceUrl}|${$t('pages.conference.accept.success.url_desc_2')}![/url]`"
                options="'Apple','Google','iCal','Outlook.com'"
                buttonsList
                buttonStyle="round"
              ></add-to-calendar-button>
            </div>

            <div class="col-span-12"></div>
          </template>
          <template v-else>
            <div class="col-span-12" v-if="schoolStore.isAiSchoolDomain">
              <img
                class="w-full rounded-xl"
                :src="
                  currentEvent.poster_file
                    ? config.public.apiBase +
                      '/media/get/' +
                      currentEvent.poster_file
                    : null
                "
              />
            </div>
            <div class="col-span-12">
              <template v-if="!schoolStore.isAiSchoolDomain">
                <p class="text-inactive">
                  <i class="pi pi-book"></i> {{ $t("pages.courses.course") }}:
                  <b class="text-active"
                    >{{ currentEvent.course_name }} -
                    {{ currentEvent.level_name }}</b
                  >
                </p>
                <p class="text-inactive">
                  <i class="pi pi-users"></i> {{ $t("pages.groups.group") }}:
                  <b class="text-active">{{ currentEvent.group_name }}</b>
                </p>
              </template>
              <template v-else>
                <p class="text-inactive">
                  <i class="pi pi-book"></i> {{ $t("pages.courses.title") }}:
                  <b class="text-active">
                    <span class="text-list">
                      <span
                        v-for="(level, lIndex) in currentEvent.levels"
                        :key="lIndex"
                      >
                        {{ level.level_name }}
                      </span>
                    </span>
                  </b>
                </p>
              </template>
              <p class="text-inactive">
                <i class="pi pi-user"></i> {{ $t("mentor") }}:
                <b class="text-active"
                  >{{
                    currentEvent.mentor_last_name ||
                    currentEvent.moderator_last_name ||
                    ""
                  }}
                  {{
                    currentEvent.mentor_first_name ||
                    currentEvent.moderator_first_name ||
                    ""
                  }}</b
                >
              </p>
              <p class="text-inactive">
                <i class="pi pi-clock"></i> {{ $t("start_time") }}:
                <b class="text-active">{{
                  currentEvent.start_time_formatted
                }}</b>
              </p>
              <p class="text-inactive mb-0">
                <i class="pi pi-clock"></i> {{ $t("end_time") }}:
                <b class="text-active">{{ currentEvent.end_time_formatted }}</b>
              </p>
            </div>
            <div v-if="currentEvent.members.length" class="col-span-12">
              <p>
                {{ $t("pages.conference.participants") }}:
                <b>{{ currentEvent.members.length }}</b>
              </p>

              <div v-if="currentEvent.members.length > 0" class="btn-wrap">
                <userTag
                  v-for="(member, index) in currentEvent.members"
                  :key="index"
                  :user="member"
                  :closable="false"
                />
              </div>
            </div>

            <div
              v-if="
                schoolStore.isAiSchoolDomain &&
                currentEvent.is_active === false &&
                currentEvent.is_learner === true
              "
              class="col-span-12"
            >
              <button
                @click="acceptConference(currentEvent.uuid)"
                class="btn btn-success"
              >
                <i class="pi pi-check"></i>
                {{ $t("pages.conference.accept.title") }}
              </button>
            </div>

            <div class="col-span-12" v-if="currentEvent.is_active === true">
              <nuxt-link
                class="btn btn-success"
                :to="localePath('/dashboard/conference/' + currentEvent.uuid)"
              >
                <i class="pi pi-video"></i>
                {{ $t("pages.conference.join") }}
              </nuxt-link>
            </div>
          </template>
        </div>
      </template>
    </modal>

    <modal
      :show="paymentModalIsVisible"
      :onClose="() => closePaymentModal()"
      :className="paymentModalSize"
      :showLoader="pendingPayment"
      :showPendingText="true"
      :pendingText="
        currentStep === paymentSteps.length
          ? $t('pages.payment.please_wait')
          : $t('loading')
      "
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h4>{{ $t("pages.lessons.pay_for_lessons_alt") }}</h4>
      </template>
      <template v-slot:body_content>
        <form
          @submit.prevent="
            currentStep === paymentSteps.length
              ? createCryptogram()
              : handlePayment()
          "
          ref="paymentFormRef"
        >
          <steps :currentStep="currentStep" :steps="paymentSteps">
            <div
              v-for="(step, index) in paymentSteps"
              :key="index"
              :class="currentStep === index + 1 ? 'block' : 'hidden'"
            >
              <component
                v-if="step.component"
                :is="step.component"
                v-bind="step.props"
              ></component>
            </div>
          </steps>

          <div class="btn-wrap justify-end mt-4">
            <button
              v-if="currentStep > 1"
              class="btn btn-light"
              @click="backToStep(currentStep - 1)"
              type="button"
            >
              <i class="pi pi-arrow-left"></i>
              {{ $t("back") }}
            </button>

            <button class="btn btn-primary" type="submit">
              <template v-if="currentStep !== paymentSteps.length">
                <i class="pi pi-arrow-right"></i>
                {{ $t("continue") }}
              </template>
              <template v-else>
                <i class="pi pi-credit-card"></i>
                {{ $t("pages.payment.to_pay") }}
              </template>
            </button>
          </div>
        </form>
      </template>
    </modal>
  </client-only>
</template>

<script setup>
import { useRouter } from "nuxt/app";
import { sanitize } from "../../utils/sanitize";
import steps from "../../components/ui/steps.vue";
import firstStep from "../../components/payment/lesson/firstStep.vue";
import secondStep from "../../components/payment/lesson/secondStep.vue";
import modal from "../../components/ui/modal.vue";
import userTag from "../../components/ui/userTag.vue";
import animatedNumber from "../../components/ui/animatedNumber.vue";
import currentConferenceCard from "../../components/conference/currentConferenceCard.vue";
import userAvatar from "../../components/ui/userAvatar.vue";
import roleProvider from "../../components/ui/roleProvider.vue";
import loader from "../../components/ui/loader.vue";
import alert from "../../components/ui/alert.vue";
import scrollFadeContainer from "../../components/ui/scrollFadeContainer.vue";
import aiExplainer from "../../components/lesson/components/ai/aiExplainer.vue";
import { useToast } from "vue-toastification";
import { startConfetti, stopConfetti } from "../../utils/confetti.js";

const config = useRuntimeConfig();
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const schoolStore = useSchoolStore();
const pending = ref(true);
const toast = useToast();
const { t, localeProperties } = useI18n();
const authUser = useSanctumUser();
const dashboard = ref([]);
const paymentLessons = ref([]);
const currentEvent = ref(null);
const pendingEvent = ref(false);
const eventModalIsVisible = ref(false);
const paymentModalIsVisible = ref(false);
const paymentModalSize = ref("modal-4xl");
const checkout = ref(null);
const pendingPayment = ref(false);
const paymentFormRef = ref(null);
const cryptogram = ref("");
const acceptedConference = ref(false);
const errors = ref([]);

useHead({
  title: t("pages.dashboard.title"),
  meta: [{ name: "description", content: t("pages.home.description") }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const paymentSteps = [
  {
    title: t("pages.lessons.lessons_list"),
    component: firstStep,
    modalSize: "4xl",
    props: { paymentLessons },
  },
  {
    title: t("pages.payment.accept_payment"),
    component: secondStep,
    modalSize: "xl",
    props: {
      paymentLessons,
      errors,
    },
  },
];

const currentStep = ref(1);

const backToStep = (step) => {
  currentStep.value = step;
  paymentModalSize.value = "modal-" + paymentSteps[step - 1].modalSize;
};

const getDashboard = async () => {
  pending.value = true;
  await $axiosPlugin
    .get("dashboard/get")
    .then((response) => {
      dashboard.value = response.data;
      createPaymentScript();

      paymentLessons.value = dashboard.value.upcoming_lessons.filter(
        (l) =>
          l.is_active === false &&
          l.is_bought_status != null &&
          l.is_bought_status.is_bought === false,
      );

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

const createPaymentScript = async () => {
  if (schoolStore.schoolData.tiptoppay.public_id_marketplace) {
    // Теперь объект tiptop гарантированно доступен
    checkout.value = new tiptop.Checkout({
      publicId: schoolStore.schoolData.tiptoppay.public_id_marketplace,
      container: paymentFormRef.value,
    });
  }
};

const createCryptogram = async () => {
  pendingPayment.value = true;
  await checkout.value
    .createPaymentCryptogram()
    .then((c) => {
      cryptogram.value = c;
      setTimeout(() => {
        if (cryptogram.value) {
          handlePayment();
        }
      }, 200);
    })
    .catch((err) => {
      errors.value = err;
      pendingPayment.value = false;
    });
};

const openEventModal = (uuid) => {
  eventModalIsVisible.value = true;
  currentEvent.value = {
    ...dashboard.value.upcoming_lessons.find((e) => e.uuid === uuid),
  };
};

const closeEventModal = () => {
  eventModalIsVisible.value = false;
  currentEvent.value = null;
  acceptedConference.value = false;
};

const openPaymentModal = () => {
  paymentModalSize.value = "modal-" + paymentSteps[0].modalSize;
  paymentModalIsVisible.value = true;
  currentStep.value = 1;
};

const closePaymentModal = () => {
  paymentModalIsVisible.value = false;
  currentEvent.value = null;
  currentStep.value = 1;
  errors.value = [];
  pendingPayment.value = false;
  cryptogram.value = "";
};

const handlePayment = async () => {
  pendingPayment.value = true;
  const formData = new FormData(paymentFormRef.value);
  formData.append("lang", localeProperties.value.code);
  formData.append("lessons", JSON.stringify(paymentLessons.value));
  formData.append("cryptogram", cryptogram.value);
  formData.append("step", currentStep.value);

  await $axiosPlugin
    .post("payment/lesson/handle", formData)
    .then((response) => {
      errors.value = [];
      if (response.data.step) {
        currentStep.value = response.data.step + 1;
        paymentModalSize.value =
          "modal-" + paymentSteps[response.data.step].modalSize;
        pendingPayment.value = false;
      } else {
        if (response.data.Success === true) {
          //   getSchool().then(() => {
          router.push({
            path: "/dashboard/payment-result",
            query: {
              success: true,
            },
          });
          //   });
        } else {
          if (response.data.Model.AcsUrl) {
            router.push({
              path: "/dashboard/payment-result/3ds",
              query: {
                AcsUrl: response.data.Model.AcsUrl,
                PaReq: response.data.Model.PaReq,
                MD: response.data.Model.TransactionId,
                TermUrl:
                  config.public.apiBase + "/payment/tiptop/handle3ds/learner",
              },
            });
          } else {
            router.push({
              path: "/dashboard/payment-result",
              query: {
                success: false,
                reason: response.data.Model.ReasonCode,
                message: response.data.Model.CardHolderMessage,
              },
            });
          }
        }
      }
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          pendingPayment.value = false;
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

const acceptConference = async (uuid) => {
  pendingEvent.value = true;

  await $axiosPlugin
    .post("conferences/accept/" + uuid)
    .then((response) => {
      pendingEvent.value = false;
      acceptedConference.value = true;
      startConfetti("confetti-canvas");
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 400) {
          pendingEvent.value = false;

          if (err.response.data.message) {
            toast(
              err.response.data.message === "not_bought"
                ? t("pages.conference.not_bought", {
                    courses: currentEvent.value.levels
                      .map((l) => l.level_name)
                      .join(", "),
                  })
                : t("pages.conference.accept." + err.response.data.message),
              {
                toastClassName: ["custom-toast", "danger"],
                timeout: 10000,
              },
            );
          }
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

// 1. Получаем объект текущего запроса/URL
const requestUrl = useRequestURL();

// 2. Собираем корневой URL (протокол + домен) и добавляем нужный роут с UUID
const conferenceUrl = computed(() => {
  // requestUrl.origin вернет строку вида "https://my-site.kz" или "http://localhost:3000"
  if (currentEvent.value) {
    return `${requestUrl.origin}/dashboard/conference/${currentEvent.value.uuid}`;
  }

  return null;
});

const timeIsUp = () => {
  setTimeout(() => {
    getDashboard();
  }, 1000);
};

onMounted(async () => {
  getDashboard();

  // Импортируем библиотеку только на стороне клиента (в браузере)
  await import("add-to-calendar-button");
});

onBeforeUnmount(() => {
  stopConfetti();
});
</script>
