<template>
  <client-only>
    <div v-if="schoolStore.schoolData" class="col-span-12">
      <h2>{{ schoolStore.schoolData.full_school_name }}</h2>

      <div class="card p-4">
        <div class="custom-grid !gap-y-8">
          <div class="col-span-12 md:col-span-6">
            <div class="bg-inactive p-2 rounded-lg">
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
                  >{{ schoolStore.schoolData.location_name }},
                  {{ schoolStore.schoolData.fact_address }}</b
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
            <div class="bg-corp-100 p-2 rounded-lg">
              <h4 class="mb-0 text-corp">
                {{ $t("pages.subscription.plan") }}
              </h4>
            </div>

            <div class="pt-4">
              <p class="mb-3">
                {{ $t("pages.subscription.your_plan") }}:
                <b class="text-corp">{{
                  schoolStore.schoolData.school_name
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
                {{ $t("pages.subscription.prolongation") }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <modal
      :show="subscriptionModalIsVisible"
      :onClose="() => (subscriptionModalIsVisible = false)"
      :className="'modal-xl'"
      :showLoader="pending"
      :closeOnClickSelf="false"
    >
      <template v-slot:header_content>
        <h4>{{ $t("pages.subscription.prolongation_title") }}</h4>
      </template>
      <template v-slot:body_content>
        <div class="custom-grid mt-4">
          <div class="col-span-12">
            <div class="form-group-border select active label-active">
              <i class="pi pi-calendar"></i>
              <select v-model="selectedPlan">
                <option selected disabled value="">
                  {{ $t("pages.subscription.choose_a_plan") }}
                </option>
              </select>
              <label>
                {{ $t("pages.subscription.plan") }}
              </label>
            </div>
          </div>
        </div>

        <form
          class="mt-2"
          @submit.prevent="createCryptogram()"
          ref="formRef"
          autocomplete="off"
        >
          <div class="border-inactive bg-inactive overflow-hidden rounded-2xl">
            <div class="custom-grid">
              <div class="col-span-12">
                <div class="custom-grid !gap-0">
                  <div class="col-span-12 md:col-span-8">
                    <div
                      class="border-inactive !border-l-0 !border-t-0 md:!border-b-0 !border-r-0 md:!border-r bg-active p-6 rounded-2xl"
                    >
                      <div class="custom-grid">
                        <div class="col-span-12">
                          <b>{{ $t("form.card.input_bank_data") }}</b>
                        </div>
                        <div class="col-span-12">
                          <div class="form-group-border active">
                            <i class="pi pi-credit-card"></i>
                            <input
                              data-cp="cardNumber"
                              v-mask="'#### #### #### ####'"
                              placeholder=" "
                            />
                            <label
                              :class="{ 'label-error': errors.cardNumber }"
                            >
                              {{
                                errors.cardNumber
                                  ? $t(
                                      "form.card.tiptop.errors." +
                                        errors.cardNumber
                                    )
                                  : $t("form.card.card_num")
                              }}
                            </label>
                          </div>
                        </div>

                        <div class="col-span-12">
                          <p class="mb-0 text-xs text-inactive">
                            {{ $t("form.card.expiration_at") }}
                          </p>
                        </div>
                        <div class="col-span-6">
                          <div class="form-group-border active">
                            <input
                              class="!px-3"
                              data-cp="expDateMonth"
                              v-mask="'##'"
                              placeholder=" "
                            />
                            <label
                              class="!left-2"
                              :class="{ 'label-error': errors.expDateMonth }"
                            >
                              {{
                                errors.expDateMonth
                                  ? $t(
                                      "form.card.tiptop.errors." +
                                        errors.expDateMonth
                                    )
                                  : $t("form.card.month")
                              }}
                            </label>
                          </div>
                        </div>
                        <div class="col-span-6">
                          <div class="form-group-border active">
                            <input
                              class="!px-3"
                              data-cp="expDateYear"
                              v-mask="'##'"
                              placeholder=" "
                            />
                            <label
                              class="!left-2"
                              :class="{ 'label-error': errors.expDateYear }"
                            >
                              {{
                                errors.expDateYear
                                  ? $t(
                                      "form.card.tiptop.errors." +
                                        errors.expDateYear
                                    )
                                  : $t("form.card.year")
                              }}
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-span-12 md:col-span-4">
                    <div class="py-8">
                      <div
                        class="h-10 border-inactive !border-x-0 bg-active w-full mb-4 hidden md:block"
                      ></div>

                      <div class="px-6">
                        <p class="mb-3 text-xs text-inactive">
                          {{ $t("form.card.cvv") }}
                        </p>

                        <div
                          class="form-group-border active label-inactive !max-w-28"
                        >
                          <input
                            class="!px-3"
                            data-cp="cvv"
                            v-mask="'###'"
                            placeholder=" "
                          />
                          <label
                            class="!left-2"
                            :class="{ 'label-error': errors.cvv }"
                          >
                            {{
                              errors.cvv
                                ? $t("form.card.tiptop.errors." + errors.cvv)
                                : "CVV"
                            }}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button class="btn btn-primary mt-4" type="submit">
            <i class="pi pi-check"></i>
            {{ $t("continue") }}
          </button>
        </form>
      </template>
    </modal>
  </client-only>
</template>

<script setup>
import { useRouter } from "nuxt/app";
import modal from "../../../components/ui/modal.vue";
const config = useRuntimeConfig();
const { $axiosPlugin } = useNuxtApp();
const schoolStore = useSchoolStore();
const router = useRouter();

const checkout = ref(null);

const subscriptionModalIsVisible = ref(false);
const pending = ref(true);
const selectedPlan = ref("");
const formRef = ref(null);
const errors = ref([]);

useHead({
  title: schoolStore.schoolData?.full_school_name,
  meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

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
    .then((cryptogram) => {
      errors.value = [];
      handlePayment(cryptogram);
    })
    .catch((err) => {
      errors.value = err;
      pending.value = false;
    });
};

const handlePayment = async (cryptogram) => {
  try {
    const response = await $axiosPlugin.post("payment/tiptop/handle", {
      amount: 100.0,
      currency: "KZT",
      cryptogram: cryptogram,
    });

    if (response.data) {
      pending.value = false;

      if (response.data.Success === true) {
        router.push({
          path: "/dashboard/payment-result",
          query: {
            success: true,
            order: response.data.Model.TransactionId,
          },
        });
      } else {
        if (response.data.Model.AcsUrl) {
          router.push({
            path: "/dashboard/payment-result/3ds",
            query: {
              AcsUrl: response.data.Model.AcsUrl,
              PaReq: response.data.Model.PaReq,
              TransactionId: response.data.Model.TransactionId,
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
    }
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

onMounted(() => {
  getPaymentAttributes();
});
</script>
