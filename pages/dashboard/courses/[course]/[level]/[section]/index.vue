<template>
  <loader v-if="pending" :className="'full-overlay'" :showPendingText="true" />

  <div
    v-if="
      lessonsData && lessonsData.level.available_status.is_available === true
    "
    class="col-span-12"
  >
    <div class="custom-grid">
      <div class="col-span-12">
        <div
          class="flex flex-wrap gap-x-2 gap-y-4 items-center justify-between"
        >
          <h2 class="mb-0">{{ lessonsData.section.section_name }}</h2>
          <roleProvider :roles="[1]" :redirect="false">
            <div class="btn-wrap justify-end">
              <button
                class="btn btn-primary"
                type="button"
                @click="showAddLessonModal()"
              >
                <i class="pi pi-plus-circle"></i>
                {{ $t("pages.lessons.add_lesson") }}
              </button>
            </div>
          </roleProvider>
        </div>
      </div>

      <div
        v-if="
          schoolStore.isAiSchoolDomain &&
          lessonsData &&
          lessonsData.level.is_available_always === 0
        "
        class="col-span-12 lg:col-span-3"
      >
        <stickyBox>
          <div
            class="text-white p-5 rounded-xl select-none"
            :class="
              lessonsData.level.has_expired === 1 ? 'bg-danger' : 'bg-corp'
            "
          >
            <p>
              <b>
                {{
                  $t(
                    lessonsData.level.has_expired === 1
                      ? "pages.courses.has_expired"
                      : "pages.courses.purchase",
                  )
                }}
              </b>
            </p>

            <button class="btn btn-white" @click="openPaymentModal()">
              {{ $t("pages.courses.purchase_button") }}
            </button>
          </div>
        </stickyBox>
      </div>

      <div
        v-if="lessonsData && lessonsData.section.lessons.length"
        class="col-span-12"
        :class="
          schoolStore.isAiSchoolDomain &&
          lessonsData &&
          lessonsData.level.is_available_always === 0
            ? 'lg:col-span-9'
            : ''
        "
      >
        <ul class="list-group">
          <li v-if="lessonsData && lessonsData.section.completed_percent > 0">
            <p class="mb-2">
              <b> {{ $t("pages.courses.section_overall_progress") }}:</b>
            </p>
            <progressBar
              :progressPercentage="lessonsData.section.completed_percent"
              :wrapClass="'!my-0'"
              :showPercentage="true"
              :className="'sm success'"
            />
          </li>

          <li
            v-for="(lesson, lessonIndex) in lessonsData.section.lessons"
            :key="lessonIndex"
            class="list-item cursor-pointer"
            @click="
              lesson.available_status.is_available === true
                ? openLesson(
                    '/dashboard/courses/' +
                      course_slug +
                      '/' +
                      level_slug +
                      '/' +
                      section_id +
                      '/' +
                      lesson.lesson_id,
                  )
                : schoolStore.isAiSchoolDomain
                  ? openPaymentModal()
                  : openUnAvailableModal()
            "
          >
            <div class="flex justify-between items-center gap-x-2">
              <div class="flex flex-col">
                <div
                  class="font-medium"
                  :class="
                    lesson.available_status.is_available === true
                      ? 'text-corp'
                      : 'text-inactive line-through'
                  "
                >
                  {{ lessonIndex + 1 }}. {{ lesson.lesson_name }}
                </div>
                <div class="flex gap-x-2 gap-y-0.5 flex-wrap">
                  <div class="flex gap-2">
                    <span
                      v-if="lesson.lesson_type_slug !== 'file_test'"
                      class="text-xs"
                      :class="
                        lesson.available_status.is_available === true
                          ? 'text-active'
                          : 'text-inactive'
                      "
                      >{{ $t("materials.materials_count") }}:
                      <b>{{ lesson.materials.length }}</b></span
                    >
                    <span
                      class="text-xs"
                      :class="
                        lesson.available_status.is_available === true
                          ? 'text-active'
                          : 'text-inactive'
                      "
                      >{{ $t("pages.tasks.tasks_count") }}:
                      <b>{{ lesson.tasks.length }}</b></span
                    >
                  </div>
                  <span
                    v-if="!schoolStore.isAiSchoolDomain"
                    class="text-xs text-inactive"
                    >({{ lesson.lesson_type_name }})</span
                  >

                  <!-- <span
                    v-if="lesson.available_status.is_bought_status != null"
                    class="text-xs"
                    :class="
                      lesson.available_status.is_bought_status.is_bought === true
                        ? 'text-success'
                        : 'text-danger'
                    "
                    ><b>{{
                      lesson.available_status.is_bought_status.is_bought === true
                        ? (lesson.available_status.is_bought_status.is_free ? $t("pages.lessons.free_lesson") : $t("pages.payment-result.success_alt"))
                        : $t("pages.payment-result.fail_alt")
                    }}</b></span
                  > -->
                </div>
              </div>

              <circleProgressBar :progress="lesson.completed_tasks_percent" />
            </div>
          </li>
        </ul>
      </div>

      <div v-else class="col-span-12">
        <alert :className="'light'">
          <p class="mb-0">{{ $t("pages.lessons.there_is_no_lessons_alt") }}</p>
        </alert>
      </div>
    </div>
  </div>
  <div v-else class="col-span-12">
    <alert :className="'light'">
      <p class="mb-0">{{ $t("pages.courses.course_is_not_available") }}</p>
    </alert>
  </div>

  <roleProvider :roles="[1]" :redirect="false">
    <modal
      :show="addLessonModalIsVisible"
      :onClose="() => closeAddLessonModal()"
      :className="'modal-xl'"
      :showLoader="pendingAddLesson"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h4>{{ $t("pages.add-lesson.title") }}</h4>
      </template>
      <template v-slot:body_content>
        <form
          class="mt-2"
          @submit.prevent="addLessonSubmit"
          ref="addLessonFormRef"
        >
          <div class="custom-grid">
            <div class="col-span-12">
              <div class="form-group-border active label-active">
                <i class="pi pi-book"></i>
                <input
                  autoComplete="new-lesson-name"
                  name="lesson_name"
                  type="text"
                  placeholder=" "
                />
                <label :class="{ 'label-error': errors.lesson_name }">
                  {{
                    errors.lesson_name
                      ? errors.lesson_name[0]
                      : $t("pages.lessons.lesson_name")
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border active label-active">
                <i class="pi pi-book"></i>
                <textarea
                  autoComplete="new-lesson-description"
                  name="lesson_description"
                  placeholder=" "
                ></textarea>
                <label :class="{ 'label-error': errors.lesson_description }">
                  {{
                    errors.lesson_description
                      ? errors.lesson_description[0]
                      : $t("pages.lessons.lesson_description")
                  }}
                </label>
              </div>
            </div>

            <div class="col-span-12">
              <div class="form-group-border select active label-active">
                <i class="pi pi-book"></i>
                <select name="lesson_type_id">
                  <option selected disabled value="">
                    {{ $t("pages.lessons.choose_a_lesson_type") }}
                  </option>
                  <option
                    v-for="(item, index) in lessonTypes"
                    :key="index"
                    :value="item.lesson_type_id"
                  >
                    {{ item.lesson_type_name }}
                  </option>
                </select>
                <label :class="{ 'label-error': errors.lesson_type_id }">
                  {{
                    errors.lesson_type_id
                      ? errors.lesson_type_id[0]
                      : $t("pages.lessons.lesson_type")
                  }}
                </label>
              </div>
            </div>
          </div>
          <button class="btn btn-primary mt-4" type="submit">
            <i class="pi pi-plus"></i>
            {{ $t("add") }}
          </button>
        </form>
      </template>
    </modal>
  </roleProvider>

  <modal
    :show="paymentModalIsVisible"
    :onClose="() => closePaymentModal()"
    :className="'modal-xl'"
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
      <h4>{{ lessonsData?.level.level_name }}</h4>
    </template>
    <template v-slot:body_content>
      <form
        v-if="lessonsData"
        @submit.prevent="
          currentStep === paymentSteps.length
            ? createCryptogram()
            : handlePayment()
        "
        ref="paymentFormRef"
        autocomplete="payment-form"
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
      <canvas id="confetti-canvas"></canvas>
    </template>
  </modal>

  <modal
    :show="unAvailableModalIsVisible"
    :onClose="() => (unAvailableModalIsVisible = false)"
    :className="'modal-xl'"
    :showLoader="false"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("pages.lessons.is_unavailable") }}</h4>
    </template>
    <template v-slot:body_content>
      <p class="mb-0">{{ $t("pages.lessons.is_unavailable_desc") }}</p>
    </template>
  </modal>
</template>

<script setup>
import { useRouter } from "nuxt/app";
import { useRoute } from "vue-router";
import { debounceHandler } from "../../../../../../utils/debounceHandler";
import stickyBox from "../../../../../../components/ui/stickyBox.vue";
import modal from "../../../../../../components/ui/modal.vue";
import alert from "../../../../../../components/ui/alert.vue";
import loader from "../../../../../../components/ui/loader.vue";
import progressBar from "../../../../../../components/ui/progressBar.vue";
import circleProgressBar from "../../../../../../components/ui/circleProgressBar.vue";
import roleProvider from "../../../../../../components/ui/roleProvider.vue";
import steps from "../../../../../../components/ui/steps.vue";
import firstStep from "../../components/payment/level/firstStep.vue";
import secondStep from "../../components/payment/level/secondStep.vue";
import { startConfetti, stopConfetti } from "../../../../../../utils/confetti";

const config = useRuntimeConfig();
const router = useRouter();
const route = useRoute();
const { t, localeProperties } = useI18n();
const schoolStore = useSchoolStore();

const errors = ref([]);
const course_slug = route.params.course;
const level_slug = route.params.level;
const section_id = route.params.section;

const { $axiosPlugin } = useNuxtApp();
const lessonsData = ref(null);
const pending = ref(true);
const pendingAddLesson = ref(false);

const pageTitle = ref("");

const addLessonModalIsVisible = ref(false);
const unAvailableModalIsVisible = ref(false);

const addLessonFormRef = ref(null);

const lessonTypes = ref([]);

const checkout = ref(null);
const paymentModalIsVisible = ref(false);
const paymentModalSize = ref("modal-lg");
const pendingPayment = ref(false);
const paymentFormRef = ref(null);
const cryptogram = ref("");
const promoCode = ref("");

useHead(() => ({
  title: pageTitle.value,
  meta: [{ name: "description", content: "Section" }],
}));

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const findPromo = async () => {
  errors.value = [];
  lessonsData.value.level.promo_discount = null;

  if (promoCode.value !== "") {
    pendingPayment.value = true;
    const formData = new FormData();
    formData.append("code", promoCode.value);

    await $axiosPlugin
      .post("/courses/promo/find", formData)
      .then((response) => {
        errors.value = [];
        lessonsData.value.level.promo_discount = response.data.discount_percent;
        startConfetti("confetti-canvas");
      })
      .catch((err) => {
        if (err.response) {
          if (err.response.status == 422) {
            errors.value = err.response.data;
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
      })
      .finally(() => {
        pendingPayment.value = false;
      });
  }
};

const debouncePromo = debounceHandler(() => findPromo(), 800);

const paymentSteps = [
  {
    title: t("pages.payment.making_an_order"),
    component: firstStep,
    modalSize: "lg",
    props: {
      errors,
      lessonsData,
      promoCode,
      findPromo,
      debouncePromo,
    },
  },
  {
    title: t("pages.payment.accept_payment"),
    component: secondStep,
    modalSize: "xl",
    props: {
      errors,
      lessonsData,
    },
  },
];

const currentStep = ref(1);

const backToStep = (step) => {
  currentStep.value = step;
  paymentModalSize.value = "modal-" + paymentSteps[step - 1].modalSize;
};

const showAddLessonModal = () => {
  addLessonModalIsVisible.value = true;
};

const getSection = async () => {
  pending.value = true;

  await $axiosPlugin
    .get("courses/" + course_slug + "/" + level_slug + "/" + section_id)
    .then((response) => {
      const courseCrumbItem = document.querySelector(
        'span[data-crumb="[course]"]',
      );

      // Проверить, найден ли элемент
      if (courseCrumbItem) {
        // Изменить текст внутри элемента
        courseCrumbItem.textContent = response.data.course.course_name;
      }

      const levelCrumbItem = document.querySelector(
        'span[data-crumb="[level]"]',
      );

      // Проверить, найден ли элемент
      if (levelCrumbItem) {
        // Изменить текст внутри элемента
        levelCrumbItem.textContent = response.data.level.level_name;
      }

      const sectionCrumbItem = document.querySelector(
        'span[data-crumb="[section]"]',
      );

      // Проверить, найден ли элемент
      if (sectionCrumbItem) {
        // Изменить текст внутри элемента
        sectionCrumbItem.textContent = response.data.section.section_name;
      }

      pageTitle.value = response.data.section.section_name;

      lessonsData.value = response.data;

      setTimeout(() => {
        createPaymentScript();
      }, 1000);

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

const addLessonSubmit = async () => {
  pendingAddLesson.value = true;
  const formData = new FormData(addLessonFormRef.value);

  formData.append("operation_type_id", 7);

  await $axiosPlugin
    .post(
      "courses/" +
        course_slug +
        "/" +
        level_slug +
        "/" +
        section_id +
        "/add_lesson",
      formData,
    )
    .then((response) => {
      getSection();
      closeAddLessonModal();
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          pendingAddLesson.value = false;
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

const getLessonTypes = async () => {
  pending.value = true;

  await $axiosPlugin
    .get("courses/get_lesson_types")
    .then((response) => {
      lessonTypes.value = response.data;
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

const closeAddLessonModal = () => {
  addLessonModalIsVisible.value = false;
  pendingAddLesson.value = false;
  addLessonFormRef.value.reset();
  errors.value = [];
};

const openLesson = (url) => {
  router.push(url);
};

const openPaymentModal = () => {
  paymentModalIsVisible.value = true;
  errors.value = [];
};

const closePaymentModal = () => {
  paymentModalIsVisible.value = false;
  currentStep.value = 1;
  errors.value = [];
  pendingPayment.value = false;
  paymentFormRef.value.reset();
  promoCode.value = "";
  cryptogram.value = "";
};

const openUnAvailableModal = () => {
  unAvailableModalIsVisible.value = true;
};

const createPaymentScript = () => {
  // Теперь объект tiptop гарантированно доступен
  checkout.value = new tiptop.Checkout({
    publicId: schoolStore.schoolData.tiptoppay.public_id,
    container: paymentFormRef.value,
  });
};

const handlePayment = async () => {
  pendingPayment.value = true;
  const formData = new FormData(paymentFormRef.value);
  formData.append("lang", localeProperties.value.code);
  formData.append("level_id", lessonsData.value.level.level_id);
  formData.append("cryptogram", cryptogram.value);
  formData.append("step", currentStep.value);

  await $axiosPlugin
    .post("payment/course_level/handle", formData)
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
                  config.public.apiBase + "/payment/tiptop/handle3ds/level",
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

onMounted(() => {
  getLessonTypes();
  getSection();
});

onBeforeUnmount(() => {
  stopConfetti();
});
</script>
