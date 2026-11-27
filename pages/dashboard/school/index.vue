<template>
  <client-only>
    <div v-if="school" class="col-span-12 flex flex-col gap-5">
      <!-- Шапка: аватар, название, адрес платформы -->
      <div class="school-hero">
        <div class="school-avatar" aria-hidden="true">{{ schoolInitials }}</div>
        <div class="min-w-0 flex-1">
          <h2 class="mb-1 leading-tight">{{ decodeEntities(school.full_school_name) }}</h2>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-inactive">
            <span v-if="school.school_name !== school.full_school_name">
              {{ decodeEntities(school.school_name) }}
            </span>
            <span v-if="school.school_domain" class="inline-flex items-center gap-1.5">
              <i class="pi pi-globe" aria-hidden="true"></i>
              <a :href="schoolUrl" target="_blank" rel="noopener noreferrer" class="font-medium">{{
                school.school_domain
              }}</a>
              <button
                type="button"
                class="copy-btn"
                :title="$t('copy')"
                :aria-label="$t('copy') + ': ' + school.school_domain"
                @click="copy(schoolUrl)"
              >
                <i :class="copiedValue === schoolUrl ? 'pi pi-check text-success' : 'pi pi-copy'" aria-hidden="true"></i>
              </button>
            </span>
            <span v-if="school.created_at" class="inline-flex items-center gap-1.5">
              <i class="pi pi-calendar" aria-hidden="true"></i>
              {{ $t("registered_at") }}: {{ formatDate(school.created_at) }}
            </span>
          </div>
        </div>
      </div>

      <div class="custom-grid">
        <!-- Подписка: тариф, статус, дни, продление -->
        <section class="col-span-12 lg:col-span-6 school-card" :class="'sub-' + subscription.state">
          <div class="school-card-head">
            <span class="school-card-icon"><i class="pi pi-star" aria-hidden="true"></i></span>
            <h4 class="mb-0">{{ $t("pages.subscription.plan") }}</h4>
            <span class="status-pill ml-auto" :class="subscription.pill">
              {{ $t("pages.subscription.status_" + subscription.state) }}
            </span>
          </div>

          <div class="flex flex-col gap-1">
            <span class="text-sm text-inactive">{{ $t("pages.subscription.your_plan") }}</span>
            <b class="text-xl leading-tight">{{ school.subscription_plan_name || "—" }}</b>
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span class="text-inactive">
                {{ $t("pages.subscription.expired_at") }}:
                <b class="text-active">{{ formatDate(school.subscription_expiration_at) }}</b>
              </span>
              <b :class="subscription.textClass">{{ subscription.label }}</b>
            </div>
            <!-- Чем меньше осталось, тем короче и краснее полоса (шкала — 30 дней) -->
            <div class="school-progress" aria-hidden="true">
              <div :style="{ width: subscription.percent + '%' }"></div>
            </div>
          </div>

          <p v-if="subscription.state !== 'active'" class="mb-0 text-sm" :class="subscription.textClass">
            <i class="pi pi-exclamation-triangle" aria-hidden="true"></i>
            {{ $t("pages.subscription.renew_now") }}
          </p>

          <div class="mt-auto">
            <button
              type="button"
              class="btn"
              :class="subscription.state === 'active' ? 'btn-light' : 'btn-primary'"
              @click="subscriptionModalIsVisible = true"
            >
              <i class="pi pi-refresh" aria-hidden="true"></i>
              {{ $t("pages.subscription.prolongation") }}
            </button>
          </div>
        </section>

        <!-- Неоплаченный счёт -->
        <section v-if="school.invoice" class="col-span-12 lg:col-span-6 school-card invoice">
          <div class="school-card-head">
            <span class="school-card-icon"><i class="pi pi-receipt" aria-hidden="true"></i></span>
            <h4 class="mb-0">
              {{ $t("pages.payment.methods.invoice.title") }}
              № {{ formatToInvoiceNumber(school.invoice.payment_id) }}
            </h4>
            <span class="status-pill text-amber-600 dark:text-amber-400 ml-auto">{{ $t("pages.school.invoice_pending") }}</span>
          </div>

          <div class="flex flex-col gap-0.5">
            <span class="text-sm text-inactive">{{ $t("pages.payment.methods.invoice.document.summ") }}</span>
            <b class="text-2xl leading-tight tabular-nums">
              {{ formatMoney(school.invoice.sum) }} {{ $contacts.bank.currency.iso }}
            </b>
          </div>

          <dl class="school-dl">
            <dt>{{ $t("pages.payment.methods.invoice.document.created_at") }}</dt>
            <dd>{{ formatDate(school.invoice.created_at) }}</dd>
            <dt>{{ $t("pages.subscription.plan") }}</dt>
            <dd>{{ school.invoice.subscription_plan_name }}</dd>
            <template v-if="school.invoice.description">
              <dt>{{ $t("description") }}</dt>
              <dd>{{ school.invoice.description }}</dd>
            </template>
          </dl>

          <p class="mb-0 text-sm text-inactive">{{ $t("pages.school.invoice_hint") }}</p>

          <div class="mt-auto">
            <button type="button" class="btn btn-outline-primary" @click="generateInvoice(school.invoice)">
              <i class="pi pi-file-pdf" aria-hidden="true"></i>
              {{ $t("pages.payment.methods.invoice.document.download_pdf") }}
            </button>
          </div>
        </section>

        <!-- Реквизиты -->
        <section class="col-span-12 lg:col-span-6 school-card">
          <div class="school-card-head">
            <span class="school-card-icon"><i class="pi pi-building-columns" aria-hidden="true"></i></span>
            <h4 class="mb-0">{{ $t("pages.school.details") }}</h4>
          </div>

          <dl class="school-dl">
            <dt>{{ $t("form.school_name") }}</dt>
            <dd>{{ decodeEntities(school.school_name) }}</dd>

            <dt>{{ $t("form.full_school_name") }}</dt>
            <dd>{{ decodeEntities(school.full_school_name) }}</dd>

            <template v-if="school.bin">
              <dt>{{ $t("form.bin") }}</dt>
              <dd class="flex items-center gap-1.5">
                <span class="tabular-nums">{{ school.bin }}</span>
                <button
                  type="button"
                  class="copy-btn"
                  :title="$t('copy')"
                  :aria-label="$t('copy') + ': ' + school.bin"
                  @click="copy(school.bin)"
                >
                  <i :class="copiedValue === school.bin ? 'pi pi-check text-success' : 'pi pi-copy'" aria-hidden="true"></i>
                </button>
              </dd>
            </template>

            <template v-if="address">
              <dt>{{ $t("form.fact_address") }}</dt>
              <dd>{{ address }}</dd>
            </template>

            <template v-if="school.school_domain">
              <dt>{{ $t("pages.school.site") }}</dt>
              <dd>
                <a :href="schoolUrl" target="_blank" rel="noopener noreferrer">{{ school.school_domain }}</a>
              </dd>
            </template>
          </dl>
        </section>

        <!-- Пользователи -->
        <section class="col-span-12 lg:col-span-6 school-card">
          <div class="school-card-head">
            <span class="school-card-icon"><i class="pi pi-users" aria-hidden="true"></i></span>
            <h4 class="mb-0">{{ $t("pages.school.users_link") }}</h4>
          </div>

          <div class="flex flex-col gap-0.5">
            <span class="text-sm text-inactive">{{ $t("pages.school.active_users") }}</span>
            <b class="text-3xl leading-tight tabular-nums text-corp">{{ school.active_users_count ?? 0 }}</b>
          </div>

          <div class="mt-auto">
            <nuxt-link class="btn btn-light" :to="localePath('/dashboard/users-groups')">
              {{ $t("pages.school.open_users") }}
              <i class="pi pi-arrow-right" aria-hidden="true"></i>
            </nuxt-link>
          </div>
        </section>
      </div>
    </div>

    <!-- Данные школы ещё грузятся — скелетон той же формы -->
    <div v-else class="col-span-12 flex flex-col gap-5" aria-busy="true">
      <span class="sr-only">{{ $t("loading") }}</span>
      <div class="school-hero" aria-hidden="true">
        <div class="skeleton w-16 h-16 !rounded-2xl shrink-0"></div>
        <div class="flex-1 flex flex-col gap-2">
          <div class="skeleton h-7 w-2/3 max-w-md"></div>
          <div class="skeleton h-4 w-1/2 max-w-sm"></div>
        </div>
      </div>
      <div class="custom-grid" aria-hidden="true">
        <div v-for="n in 4" :key="n" class="col-span-12 lg:col-span-6 school-card">
          <div class="flex items-center gap-3">
            <div class="skeleton w-9 h-9 !rounded-xl"></div>
            <div class="skeleton h-5 w-40"></div>
          </div>
          <div class="skeleton h-6 w-1/2"></div>
          <div class="skeleton h-3 w-full"></div>
          <div class="skeleton h-10 w-32 !rounded-xl"></div>
        </div>
      </div>
    </div>

    <modal
      :show="subscriptionModalIsVisible"
      :onClose="() => closeSubscriptionModal()"
      :className="'modal-xl'"
      :showLoader="pending"
      :closeOnClickSelf="false"
      :showPendingText="true"
      :pendingText="
        currentStep === paymentSteps.length
          ? $t('pages.payment.please_wait')
          : $t('loading')
      "
    >
      <template v-slot:header_content>
        <h4>{{ $t("pages.subscription.prolongation_title") }}</h4>
      </template>
      <template v-slot:body_content>
        <form
          @submit.prevent="
            currentStep === 3 && currentPaymentMethod === 'card'
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
                <i
                  class="pi"
                  :class="
                    currentPaymentMethod === 'card'
                      ? 'pi-credit-card'
                      : 'pi-receipt'
                  "
                ></i>
                {{
                  currentPaymentMethod === "card"
                    ? $t("pages.payment.to_pay")
                    : $t("print_pdf")
                }}
              </template>
            </button>
          </div>
        </form>
      </template>
    </modal>
  </client-only>
</template>

<script setup>
import { useRoute, useRouter } from "nuxt/app";
import steps from "../../../components/ui/steps.vue";
import { formatAmountToWords } from "../../../utils/amountToWords";
import { formatToInvoiceNumber } from "../../../utils/formatToInvoiceNumber";
import { decodeEntities } from "../../../utils/decodeEntities";
import firstStep from "../../../components/payment/school/firstStep.vue";
import secondStep from "../../../components/payment/school/secondStep.vue";
import thirdStep from "../../../components/payment/school/thirdStep.vue";
import modal from "../../../components/ui/modal.vue";
import { useNotify } from "~/composables/useNotify";
const config = useRuntimeConfig();
const { $axiosPlugin, $pdfMake, $contacts } = useNuxtApp();
const schoolStore = useSchoolStore();
const route = useRoute();
const router = useRouter();
const { t, localeProperties } = useI18n();

const checkout = ref(null);
const notify = useNotify();
const localePath = useLocalePath();

const subscriptionModalIsVisible = ref(false);

// ===== Данные страницы =====
const school = computed(() => schoolStore.schoolData);

const schoolInitials = computed(() =>
  decodeEntities(school.value?.school_name || school.value?.full_school_name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join(""),
);

const schoolUrl = computed(() => {
  const domain = school.value?.school_domain;
  if (!domain) return "";
  return /^https?:\/\//.test(domain) ? domain : `https://${domain}`;
});

// Адрес без пустых частей («Алматы, , » / «undefined»)
const address = computed(() =>
  [school.value?.location_full, school.value?.street, school.value?.house]
    .map((part) => (part == null ? "" : String(part).trim()))
    .filter(Boolean)
    .join(", "),
);

// Даты и суммы — в формате выбранного языка
const dateLocale = computed(() => localeProperties.value?.iso || localeProperties.value?.code || undefined);

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(dateLocale.value) : "—";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString(dateLocale.value, { minimumFractionDigits: 2 });

// Состояние подписки: активна / скоро закончится (7 дней и меньше) / истекла
const DAY = 24 * 60 * 60 * 1000;
const EXPIRING_DAYS = 7;
const SCALE_DAYS = 30; // полоса: полная при 30 днях и больше

const subscription = computed(() => {
  const end = school.value?.subscription_expiration_at
    ? new Date(school.value.subscription_expiration_at)
    : null;
  if (!end || isNaN(end)) {
    return { state: "expired", pill: "text-danger", textClass: "text-danger", label: "", percent: 0 };
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);
  const days = Math.round((endDay - startOfToday) / DAY);

  if (days < 0) {
    return {
      state: "expired",
      pill: "text-danger",
      textClass: "text-danger",
      label: t("pages.subscription.expired_ago", { date: formatDate(end) }),
      percent: 0,
    };
  }

  const expiring = days <= EXPIRING_DAYS;
  return {
    state: expiring ? "expiring" : "active",
    pill: expiring ? "text-amber-600 dark:text-amber-400" : "text-success",
    textClass: expiring ? "text-amber-600 dark:text-amber-400" : "text-success",
    label:
      days === 0
        ? t("pages.subscription.ends_today")
        : t("pages.subscription.days_left", { n: days }),
    percent: Math.max(4, Math.min(100, (days / SCALE_DAYS) * 100)),
  };
});

// Копирование (домен, БИН) с отметкой «скопировано» на 2 секунды
const copiedValue = ref(null);
let copiedTimer = null;

const copy = async (value) => {
  try {
    await navigator.clipboard.writeText(String(value));
    copiedValue.value = value;
    notify("success", t("copied"));
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => (copiedValue.value = null), 2000);
  } catch (e) {
    notify("warning", String(value), { timeout: 15000 });
  }
};

const pending = ref(true);
const selectedPlan = ref("");
const plans = ref([]);
const paymentFormRef = ref(null);
const cryptogram = ref("");
const errors = ref([]);

const paymentMethods = ref(["invoice", "card"]);
const currentPaymentMethod = ref(paymentMethods.value[0]);

const paymentSteps = [
  {
    title: t("pages.subscription.choose_a_plan"),
    component: firstStep,
    props: { errors, plans, selectedPlan },
  },
  {
    title: t("pages.payment.choose_a_payment_method"),
    component: secondStep,
    props: {
      errors,
      paymentMethods,
      currentPaymentMethod,
    },
  },
  {
    title: t("pages.payment.accept_payment"),
    component: thirdStep,
    props: {
      errors,
      currentPaymentMethod,
      plans,
      selectedPlan,
    },
  },
];

const currentStep = ref(1);

const backToStep = (step) => {
  currentStep.value = step;
};

const today = new Date().toISOString().slice(0, 10);

useHead({
  title: decodeEntities(schoolStore.schoolData?.full_school_name),
  meta: [{ name: "description", content: t("pages.home.description") }],

  script: [
    {
      key: "tiptoppay-checkout",
      src: `${config.public.tiptopPayCheckoutURL}?v=${today}`,
      defer: true,
    },
  ],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const closeSubscriptionModal = () => {
  subscriptionModalIsVisible.value = false;
  currentStep.value = 1;
  errors.value = [];
  pending.value = false;
  currentPaymentMethod.value = paymentMethods.value[0];
  selectedPlan.value = "";
  cryptogram.value = "";
};

// Платёжный модуль создаём, только когда он нужен (оплата картой): скрипт
// подключается с defer и при открытии страницы может ещё не загрузиться,
// а форма в окне — ещё не отрисоваться. Раньше из-за этого страница
// могла уйти на /error
const ensureCheckout = () => {
  if (checkout.value) return checkout.value;
  const publicId = schoolStore.schoolData?.tiptoppay?.public_id;
  if (!window.tiptop?.Checkout || !publicId || !paymentFormRef.value) return null;
  checkout.value = new window.tiptop.Checkout({
    publicId,
    container: paymentFormRef.value,
  });
  return checkout.value;
};

const getPaymentAttributes = async () => {
  try {
    const response = await $axiosPlugin.get("payment/get_attributes");
    pending.value = false;
    plans.value = response.data.plans;
  } catch (err) {
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
  }
};

const createCryptogram = async () => {
  const cardCheckout = ensureCheckout();
  if (!cardCheckout) {
    notify("danger", t("pages.school.payment_unavailable"), 12000);
    return;
  }

  pending.value = true;
  await cardCheckout
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
      pending.value = false;
    });
};

const handlePayment = async () => {
  pending.value = true;
  const formData = new FormData(paymentFormRef.value);
  formData.append("lang", localeProperties.value.code);
  formData.append("subscription_plan_id", selectedPlan.value);
  formData.append("payment_method", currentPaymentMethod.value);
  formData.append("cryptogram", cryptogram.value);
  formData.append("step", currentStep.value);

  await $axiosPlugin
    .post("payment/school/handle", formData)
    .then((response) => {
      errors.value = [];
      if (response.data.step) {
        currentStep.value = response.data.step + 1;
        pending.value = false;
      } else {
        if (currentPaymentMethod.value === "card") {
          if (response.data.Success === true) {
            getSchool().then(() => {
              router.push({
                path: "/dashboard/payment-result",
                query: {
                  success: true,
                },
              });
            });
          } else {
            if (response.data.Model.AcsUrl) {
              router.push({
                path: "/dashboard/payment-result/3ds",
                query: {
                  AcsUrl: response.data.Model.AcsUrl,
                  PaReq: response.data.Model.PaReq,
                  MD: response.data.Model.TransactionId,
                  TermUrl: config.public.apiBase + "/payment/tiptop/handle3ds",
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
        } else if (currentPaymentMethod.value === "invoice") {
          generateInvoice(response.data);
        }
      }
    })
    .catch((err) => {
      if (err.response) {
        if (err.response.status == 422) {
          errors.value = err.response.data;
          pending.value = false;
        } else {
          router.push({
            path: "/error",
            query: {
              status: err.response.status,
              message: err.response.data.message || err.response.data.Message,
              url: err.request.responseURL,
            },
          });
        }
      } else {
        router.push("/error");
      }
    });
};

const generateInvoice = async (data) => {
  const signBase64 = await getBase64ImageFromUrl("/images/sign.png");
  const docTitle = `${$contacts.name} - ${t(
    "pages.payment.methods.invoice.title",
  )} № ${formatToInvoiceNumber(data.payment_id)}`;

  const docDefinition = {
    // watermark: {
    //   text: "Watermark",
    //   color: "red",
    //   opacity: 0.1,
    //   bold: false,
    //   italics: false,
    //   angle: 45,
    // },
    info: {
      title: docTitle,
      author: $contacts.legal_name[localeProperties.value.code],
      subject: t("pages.payment.methods.invoice.title"),
      keywords: t("pages.payment.methods.invoice.title"),
    },
    content: [
      {
        text: docTitle,
        fontSize: 14,
        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 15],
      },
      {
        table: {
          widths: ["*", "*", "*"],
          body: [
            [
              [
                {
                  text: `${t(
                    "pages.payment.methods.invoice.document.beneficiary",
                  )}:`,
                },
                {
                  text: $contacts.legal_name[localeProperties.value.code],
                  bold: true,
                },
                {
                  text: `${t("form.bin")}:`,
                },
                {
                  text: $contacts.bin,
                  bold: true,
                },
              ],
              [
                {
                  text: `${t("form.iik")}:`,
                },
                {
                  text: $contacts.bank.iik,
                  bold: true,
                },
              ],
              [
                {
                  text: "КБе",
                },
                {
                  text: 17,
                  bold: true,
                },
              ],
            ],
            [
              [
                {
                  text: `${t(
                    "pages.payment.methods.invoice.document.beneficiary_bank",
                  )}:`,
                },
                {
                  text: $contacts.bank.name[localeProperties.value.code],
                  bold: true,
                },
              ],
              [
                {
                  text: `${t("form.bik")}:`,
                },
                {
                  text: $contacts.bank.bik,
                  bold: true,
                },
              ],
              [
                {
                  text: `${t("form.knp")}:`,
                },
                {
                  text: 859,
                  bold: true,
                },
              ],
            ],
          ],
        },
        margin: [0, 0, 0, 15],
      },

      {
        table: {
          widths: ["*", "*", "*"],
          body: [
            [
              [
                {
                  text: `${t("pages.payment.methods.invoice.document.num")}:`,
                },
                {
                  text: formatToInvoiceNumber(data.payment_id),
                  bold: true,
                },
              ],
              [
                {
                  text: `${t(
                    "pages.payment.methods.invoice.document.created_at",
                  )}:`,
                },
                {
                  text: new Date(data.created_at).toLocaleDateString("ru-RU"),
                  bold: true,
                },
              ],
              [
                {
                  text: `${t(
                    "pages.payment.methods.invoice.document.payment_term",
                  )}:`,
                },
                {
                  text: new Date(data.created_at).toLocaleDateString("ru-RU"),
                  bold: true,
                },
              ],
            ],
          ],
        },
        margin: [0, 0, 0, 15],
      },

      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                stack: [
                  {
                    text: t(
                      "pages.payment.methods.invoice.document.please_be_careful",
                    ),
                    bold: true,
                    alignment: "center",
                    margin: [0, 0, 0, 5],
                  },
                  {
                    text: t(
                      "pages.payment.methods.invoice.document.careful_desc",
                    ),
                    alignment: "center",
                  },
                ],
                fillColor: "#e0e0e0", // серый фон
                margin: [0, 5, 0, 5],
              },
            ],
          ],
        },
        margin: [0, 0, 0, 15], // внешний отступ блока снизу
      },

      {
        table: {
          widths: [100, "*"],
          body: [
            [
              [
                {
                  text: t("pages.payment.methods.invoice.document.supplier"),
                },
                {
                  text: `(${t(
                    "pages.payment.methods.invoice.document.executor",
                  )}):`,
                },
              ],
              [
                {
                  text: `${t("form.bin")} ${$contacts.bin}, ${
                    $contacts.legal_name_full[localeProperties.value.code]
                  }.`,
                  bold: true,
                },
                {
                  text: `${$contacts.postal_code}, ${
                    $contacts.legal_address[localeProperties.value.code]
                  }, ${$contacts.phone_format}, ${$contacts.email}`,
                },
              ],
            ],
            [
              [
                {
                  text: t("pages.payment.methods.invoice.document.buyer"),
                },
                {
                  text: `(${t(
                    "pages.payment.methods.invoice.document.customer",
                  )}):`,
                },
              ],
              [
                {
                  text: `${t("form.bin")} ${schoolStore.schoolData.bin}, ${
                    decodeEntities(schoolStore.schoolData.full_school_name)
                  }.`,
                  bold: true,
                },
                {
                  text: `${schoolStore.schoolData.location_full}, ${schoolStore.schoolData.street}, ${schoolStore.schoolData.house}`,
                },
              ],
            ],
          ],
        },
        margin: [0, 0, 0, 15],
      },

      {
        text:
          t("pages.payment.methods.invoice.document.footing") +
          ": " +
          t("pages.payment.methods.invoice.document.without_contract"),
        margin: [0, 0, 0, 15],
      },

      {
        table: {
          widths: [20, "*", 60, 40, 80, 80],
          body: [
            [
              [
                {
                  text: "№",
                  bold: true,
                },
              ],
              [
                {
                  text: t("pages.payment.methods.invoice.document.item"),
                  bold: true,
                },
              ],
              [
                {
                  text: t("pages.payment.methods.invoice.document.item_num"),
                  bold: true,
                },
              ],
              [
                {
                  text: t("pages.payment.methods.invoice.document.unit"),
                  bold: true,
                },
              ],
              [
                {
                  text: t("pages.payment.methods.invoice.document.price"),
                  bold: true,
                },
              ],
              [
                {
                  text: t("pages.payment.methods.invoice.document.summ"),
                  bold: true,
                },
              ],
            ],
            [
              [
                {
                  text: 1,
                },
              ],
              [
                {
                  text: data.description,
                },
              ],
              [
                {
                  text: 1,
                },
              ],
              [
                {
                  text: t("pages.payment.methods.invoice.document.piece"),
                },
              ],
              [
                {
                  text: data.sum.toLocaleString("ru-RU", {
                    minimumFractionDigits: 2,
                  }),
                },
              ],
              [
                {
                  text: data.sum.toLocaleString("ru-RU", {
                    minimumFractionDigits: 2,
                  }),
                },
              ],
            ],
          ],
        },
        margin: [0, 0, 0, 15],
      },

      {
        text: [
          { text: `${t("pages.payment.methods.invoice.document.total")}: ` },
          {
            text: data.sum.toLocaleString("ru-RU", {
              minimumFractionDigits: 2,
            }),
            bold: true,
          },
        ],
        alignment: "right",
        margin: [0, 0, 0, 5],
      },
      // {
      //   text: [
      //     {
      //       text: `${t("pages.payment.methods.invoice.document.vat_text", {
      //         vat: $contacts.vat_percent,
      //       })}: `,
      //     },
      //     {
      //       text: (
      //         (data.sum * $contacts.vat_percent) /
      //         (100 + $contacts.vat_percent)
      //       ).toFixed(2),
      //       bold: true,
      //     },
      //   ],
      //   alignment: "right",
      //   margin: [0, 0, 0, 15],
      // },

      {
        text: [
          {
            text: `${t(
              "pages.payment.methods.invoice.document.total_items",
            )}: `,
          },
          { text: "1, " },
          {
            text: `${t("pages.payment.methods.invoice.document.summ_alt")}: `,
          },
          {
            text: `${data.sum.toLocaleString("ru-RU", {
              minimumFractionDigits: 2,
            })} ${$contacts.bank.currency.iso}`,
          },
        ],
        margin: [0, 0, 0, 5],
      },
      {
        text: [
          {
            text: `${t("pages.payment.to")}: `,
            bold: true,
          },
          {
            text: formatAmountToWords(
              data.sum,
              localeProperties.value.code,
              $contacts.bank.currency.iso,
            ),
            bold: true,
          },
        ],
        margin: [0, 0, 0, 30],
      },

      {
        columns: [
          {
            width: 100,
            text: `${t("pages.payment.methods.invoice.document.executor")}:`,
            margin: [0, 60, 0, 0],
          },
          {
            image: signBase64, // base64 картинки
            width: 150,
            margin: [0, 0, 0, 0],
          },
          {
            width: 150,
            text: `/${$contacts.founder_short}/`,
            margin: [10, 60, 0, 0],
          },
        ],
        margin: [0, 0, 0, 30],
      },

      // {
      //   qr: "text in QR",
      //   foreground: "blue",
      //   background: "white",
      //   fit: 50,
      //   eccLevel: "H",
      // },
    ],
    defaultStyle: {
      font: "Roboto",
      fontSize: 10, // 👈 общий fontSize для всего документа
    },
    pageMargins: [40, 20, 40, 20],
  };

  //$pdfMake.createPdf(docDefinition).open();
  $pdfMake.createPdf(docDefinition).download(`${docTitle}.pdf`);
  closeSubscriptionModal();
  getSchool();
};

const getBase64ImageFromUrl = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

async function getSchool() {
  await schoolStore.getSchool();
}

onMounted(() => {
  getPaymentAttributes();

  if (route.query.prolongation) {
    subscriptionModalIsVisible.value = true;
  }
});
</script>
