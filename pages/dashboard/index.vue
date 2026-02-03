<template>
  <loader v-if="pending" :className="'full-overlay'" :showPendingText="true" />
  <client-only v-if="dashboard">
    <div class="col-span-12">
      <h2 class="mb-0">
        🚀 {{ authUser?.first_name }},
        <span class="lowercase">{{ $t("welcome") }}</span>
      </h2>
    </div>

    <roleProvider :roles="[1, 2, 3]">
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
    </roleProvider>

    <div
      v-if="dashboard && authUser && !authUser.telegram && !schoolStore.isAiSchoolDomain"
      class="col-span-12 md:col-span-6 lg:col-span-9"
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

    <div v-if="dashboard" class="col-span-12">
      <div class="custom-grid" v-if="!schoolStore.isAiSchoolDomain">
        <div class="col-span-12 lg:col-span-5">
          <div class="custom-grid">
            <div class="col-span-12">
              <h3 class="mb-0 mt-4">
                📖 {{ $t("pages.lessons.current_lessons") }}
              </h3>
            </div>
            <template
              v-if="
                dashboard.current_lessons && dashboard.current_lessons.length
              "
            >
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
            </template>
            <div v-else class="col-span-12">
              <alert :className="'light'">
                <img
                  class="w-24 mx-auto mb-2"
                  src="~/public/images/calendar-search.svg"
                />
                <p class="mb-0">
                  <b>{{ $t("pages.lessons.no_current_lessons") }}</b>
                </p>
              </alert>
            </div>
          </div>
        </div>

        <div class="col-span-12 lg:col-span-7">
          <div class="custom-grid">
            <div class="col-span-12">
              <h3 class="mb-0 mt-4">
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
                          <th>{{ $t("pages.lessons.lesson_type") }}</th>
                          <roleProvider :roles="[1, 2, 3, 4]">
                            <th>{{ $t("pages.groups.group") }}</th>
                            <th>{{ $t("pages.courses.course") }}</th>
                            <th>{{ $t("pages.groups.group_category") }}</th>
                          </roleProvider>

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
                            <b>{{
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
                          <td>
                            {{ e.lesson_name }}
                          </td>
                          <td>{{ e.lesson_type_name }}</td>
                          <roleProvider :roles="[1, 2, 3, 4]">
                            <td>{{ e.group_name }}</td>
                            <td>{{ e.course_name }}</td>
                            <td>{{ e.level_name }}</td>
                          </roleProvider>

                          <td>
                            <div class="flex gap-x-1 items-center">
                              <userAvatar
                                :padding="0.5"
                                :className="'w-6 h-6'"
                                :user="{
                                  last_name: e.mentor_last_name,
                                  first_name: e.mentor_first_name,
                                  avatar: e.mentor_avatar,
                                }"
                              />
                              {{ e.mentor_last_name }}
                              {{ e.mentor_first_name }}
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
      :showLoader="false"
      :closeOnClickSelf="true"
    >
      <template v-slot:header_content>
        <h4>{{ currentEvent?.lesson_name }}</h4>
      </template>
      <template v-if="currentEvent" v-slot:body_content>
        <div class="custom-grid">
          <div class="col-span-12">
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
            <p class="text-inactive">
              <i class="pi pi-user"></i> {{ $t("mentor") }}:
              <b class="text-active"
                >{{ currentEvent.mentor_last_name }}
                {{ currentEvent.mentor_first_name }}</b
              >
            </p>
            <p class="text-inactive">
              <i class="pi pi-clock"></i> {{ $t("start_time") }}:
              <b class="text-active">{{ currentEvent.start_time_formatted }}</b>
            </p>
            <p class="text-inactive mb-0">
              <i class="pi pi-clock"></i> {{ $t("end_time") }}:
              <b class="text-active">{{ currentEvent.end_time_formatted }}</b>
            </p>
          </div>
          <div class="col-span-12">
            <p>
              {{ $t("pages.groups.members") }}:
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
const config = useRuntimeConfig();
const router = useRouter();
const { $axiosPlugin } = useNuxtApp();
const schoolStore = useSchoolStore();
const pending = ref(true);
const { t, localeProperties } = useI18n();
const authUser = useSanctumUser();
const dashboard = ref([]);
const paymentLessons = ref([]);
const currentEvent = ref(null);
const eventModalIsVisible = ref(false);
const paymentModalIsVisible = ref(false);
const paymentModalSize = ref("modal-4xl");
const checkout = ref(null);
const pendingPayment = ref(false);
const paymentFormRef = ref(null);
const cryptogram = ref("");
const errors = ref([]);

useHead({
  title: t("pages.dashboard.title"),
  meta: [{ name: "description", content: "My amazing site." }],
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
          l.is_bought_status.is_bought === false
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
  // Загружаем скрипт
  await loadScript(schoolStore.schoolData.tiptoppay.checkout_url);

  // Теперь объект tiptop гарантированно доступен
  checkout.value = new tiptop.Checkout({
    publicId: schoolStore.schoolData.tiptoppay.public_id_marketplace,
    container: paymentFormRef.value,
  });
};

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      return resolve();
    }
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
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

const timeIsUp = () => {
  setTimeout(() => {
    getDashboard();
  }, 1000);
};

onMounted(() => {
  getDashboard();
});
</script>
