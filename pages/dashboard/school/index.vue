<template>
  <client-only>
    <div v-if="schoolStore.schoolData" class="col-span-12">
      <h2>{{ schoolStore.schoolData.full_school_name }}</h2>

      <div class="card p-4">
        <div class="custom-grid !gap-y-8">
          <div class="col-span-12 md:col-span-6">
            <div class="bg-inactive px-3 py-2 rounded-xl">
              <h4 class="mb-0">
                {{ $t("pages.school.title") }}
              </h4>
            </div>

            <div class="pt-4">
              <p class="mb-3">
                {{ $t("form.school_name") }}:
                <b>{{ schoolStore.schoolData.school_name }}</b>
              </p>
              <p class="mb-3">
                {{ $t("form.full_school_name") }}:
                <b>{{ schoolStore.schoolData.full_school_name }}</b>
              </p>
              <p class="mb-3">
                {{ $t("form.school_domain") }}:
                <b class="text-corp">{{
                  schoolStore.schoolData.school_domain
                }}</b>
              </p>
              <p class="mb-3">
                {{ $t("form.fact_address") }}:
                <b
                  >{{ schoolStore.schoolData.location_full }},
                  {{ schoolStore.schoolData.street }},
                  {{ schoolStore.schoolData.house }}</b
                >
              </p>
              <p class="mb-3">
                {{ $t("form.bin") }}:
                <b>{{ schoolStore.schoolData.bin }}</b>
              </p>
              <p class="mb-0">
                {{ $t("registered_at") }}:
                <b>{{
                  new Date(
                    schoolStore.schoolData.created_at
                  ).toLocaleDateString()
                }}</b>
              </p>
            </div>
          </div>

          <div class="col-span-12 md:col-span-6">
            <div class="bg-corp-100 px-3 py-2 rounded-xl">
              <h4 class="mb-0 text-corp">
                {{ $t("pages.subscription.plan") }}
              </h4>
            </div>

            <div class="pt-4">
              <p class="mb-3">
                {{ $t("pages.subscription.your_plan") }}:
                <b class="text-corp">{{
                  schoolStore.schoolData.subscription_plan_name
                }}</b>
              </p>
              <p class="mb-3">
                {{ $t("pages.subscription.expired_at") }}:
                <b class="text-corp">{{
                  new Date(
                    schoolStore.schoolData.subscription_expiration_at
                  ).toLocaleDateString()
                }}</b>
              </p>

              <button
                class="btn btn-primary"
                @click="subscriptionModalIsVisible = true"
              >
                <i class="pi pi-refresh"></i>
                {{ $t("pages.subscription.prolongation") }}
              </button>
            </div>
          </div>

          <div
            v-if="schoolStore.schoolData.invoice"
            class="col-span-12 md:col-span-6"
          >
            <div class="bg-danger-100 px-3 py-2 rounded-xl">
              <h4 class="mb-0 text-danger">
                {{ $t("pages.payment.methods.invoice.invoices") }}
              </h4>
            </div>

            <div class="card p-4 mt-4">
              <p class="mb-1">
                {{ $t("pages.payment.methods.invoice.document.num") }}:

                <b>{{
                  formatToInvoiceNumber(
                    schoolStore.schoolData.invoice.payment_id
                  )
                }}</b>
              </p>

              <p class="mb-1">
                {{ $t("pages.payment.methods.invoice.document.created_at") }}:

                <b>{{
                  new Date(
                    schoolStore.schoolData.invoice.created_at
                  ).toLocaleDateString("ru-RU")
                }}</b>
              </p>

              <p class="mb-1">
                {{ $t("pages.subscription.plan") }}:

                <b
                  >{{ schoolStore.schoolData.invoice.subscription_plan_name }}
                </b>
              </p>

              <p class="mb-1">
                {{ $t("description") }}:

                <b>{{ schoolStore.schoolData.invoice.description }} </b>
              </p>

              <p class="mb-4">
                {{ $t("pages.payment.methods.invoice.document.summ") }}:

                <b
                  >{{
                    schoolStore.schoolData.invoice.sum.toLocaleString("ru-RU", {
                      minimumFractionDigits: 2,
                    })
                  }}
                  {{ $contacts.bank.currency.iso }}</b
                >
              </p>

              <div class="btn-wrap justify-end">
                <button
                  class="btn btn-outline-danger btn-sm"
                  @click="generateInvoice(schoolStore.schoolData.invoice)"
                >
                  <i class="pi pi-file-pdf"></i>
                  {{
                    $t("pages.payment.methods.invoice.document.download_pdf")
                  }}
                </button>
              </div>
            </div>
          </div>

          <!-- <div class="col-span-12 md:col-span-6">
            <div class="bg-inactive px-3 py-2 rounded-xl">
              <h4 class="mb-0">
                {{ $t("pages.courses.title") }}
              </h4>
            </div>


          </div> -->
        </div>
      </div>
    </div>

    <modal
      :show="subscriptionModalIsVisible"
      :onClose="() => closeSubscriptionModal()"
      :className="'modal-xl'"
      :showLoader="pending"
      :closeOnClickSelf="false"
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
          ref="formRef"
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
import firstStep from "../../../components/payment/firstStep.vue";
import secondStep from "../../../components/payment/secondStep.vue";
import thirdStep from "../../../components/payment/thirdStep.vue";
import modal from "../../../components/ui/modal.vue";
const config = useRuntimeConfig();
const { $axiosPlugin, $pdfMake, $contacts } = useNuxtApp();
const schoolStore = useSchoolStore();
const route = useRoute();
const router = useRouter();
const { t, localeProperties } = useI18n();

const checkout = ref(null);

const subscriptionModalIsVisible = ref(false);

const pending = ref(true);
const selectedPlan = ref("");
const plans = ref([]);
const formRef = ref(null);
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

useHead({
  title: schoolStore.schoolData?.full_school_name,
  meta: [{ name: "description", content: "My amazing site." }],
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

const getPaymentAttributes = async () => {
  try {
    const response = await $axiosPlugin.get("payment/get_attributes");
    pending.value = false;

    // Загружаем скрипт
    await loadScript(response.data.tiptop.checkout_url);

    // Теперь объект tiptop гарантированно доступен
    checkout.value = new tiptop.Checkout({
      publicId: response.data.tiptop.public_id,
      container: formRef.value,
    });

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
  pending.value = true;
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
      pending.value = false;
    });
};

const handlePayment = async () => {
  pending.value = true;
  const formData = new FormData(formRef.value);
  formData.append("lang", localeProperties.value.code);
  formData.append("subscription_plan_id", selectedPlan.value);
  formData.append("payment_method", currentPaymentMethod.value);
  formData.append("cryptogram", cryptogram.value);
  formData.append("step", currentStep.value);

  await $axiosPlugin
    .post("payment/handle", formData)
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
      errors.value = err.response.data;
      pending.value = false;
      return;
    });
};

const generateInvoice = async (data) => {
  const signBase64 = await getBase64ImageFromUrl("/images/sign.png");
  const docTitle = `${$contacts.name} - ${t(
    "pages.payment.methods.invoice.title"
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
                    "pages.payment.methods.invoice.document.beneficiary"
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
                    "pages.payment.methods.invoice.document.beneficiary_bank"
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
                    "pages.payment.methods.invoice.document.created_at"
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
                    "pages.payment.methods.invoice.document.payment_term"
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
                      "pages.payment.methods.invoice.document.please_be_careful"
                    ),
                    bold: true,
                    alignment: "center",
                    margin: [0, 0, 0, 5],
                  },
                  {
                    text: t(
                      "pages.payment.methods.invoice.document.careful_desc"
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
                    "pages.payment.methods.invoice.document.executor"
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
                    "pages.payment.methods.invoice.document.customer"
                  )}):`,
                },
              ],
              [
                {
                  text: `${t("form.bin")} ${schoolStore.schoolData.bin}, ${
                    schoolStore.schoolData.full_school_name
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
              "pages.payment.methods.invoice.document.total_items"
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
              $contacts.bank.currency.iso
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
