<template>
  <loader v-if="pending" :className="'full-overlay'" />
  <div class="col-span-12">
    <div class="custom-grid">
      <div class="col-span-12">
        <div class="btn-wrap">
          <button @click="showHideFileSearchFilter" class="btn btn-light">
            <i class="pi pi-search"></i>
            {{
              searchFilter === true
                ? $t("hide_search_filter")
                : $t("show_search_filter")
            }}
          </button>
        </div>
      </div>

      <div
        class="col-span-12 lg:col-span-3"
        :class="searchFilter ? 'block' : 'hidden'"
      >
        <stickyBox>
          <div class="custom-grid">
            <div class="col-span-12" :class="searchFilter ? 'block' : 'hidden'">
              <div class="card p-4">
                <h5>{{ $t("pages.invoices.search_filter") }}</h5>
                <form @submit.prevent="debounceReset" ref="searchFormRef">
                  <div class="custom-grid">
                    <div class="col-span-12">
                      <div class="form-group-border active">
                        <i class="pi pi-receipt"></i>
                        <input
                          type="text"
                          name="payment_id"
                          placeholder=" "
                          @input="debouncePayments"
                        />
                        <label>{{ $t("pages.invoices.num") }}</label>
                      </div>
                    </div>

                    <div class="col-span-12">
                      <div class="form-group-border active">
                        <i class="pi pi-building"></i>
                        <input
                          type="text"
                          name="school_name"
                          placeholder=" "
                          @input="debouncePayments"
                        />
                        <label>{{ $t("form.school_name") }}</label>
                      </div>
                    </div>

                    <div class="col-span-12">
                      <div class="form-group-border active">
                        <i class="pi pi-building"></i>
                        <input
                          type="text"
                          name="full_school_name"
                          placeholder=" "
                          @input="debouncePayments"
                        />
                        <label>{{ $t("form.full_school_name") }}</label>
                      </div>
                    </div>

                    <div class="col-span-12">
                      <div class="form-group-border active">
                        <i class="pi pi-hashtag"></i>
                        <input
                          type="number"
                          name="bin"
                          placeholder=" "
                          @input="debouncePayments"
                        />
                        <label>{{ $t("form.bin") }}</label>
                      </div>
                    </div>

                    <div v-if="attributes.plans" class="col-span-12">
                      <multipleSelect
                        :className="'form-group-border select active label-active'"
                        :icon="'pi pi-clock'"
                        :label="$t('pages.subscription.plan')"
                        :items="attributes.plans"
                        :optionName="'subscription_plans[]'"
                        :optionValue="'subscription_plan_id'"
                        :optionLabel="'subscription_plan_name'"
                        :onChange="debouncePayments"
                      />
                    </div>

                    <div v-if="attributes.methods" class="col-span-12">
                      <multipleSelect
                        :className="'form-group-border select active label-active'"
                        :icon="'pi pi-credit-card'"
                        :label="$t('pages.payment.payment_method')"
                        :items="attributes.methods"
                        :optionName="'payment_methods[]'"
                        :optionValue="'payment_method_id'"
                        :optionLabel="'payment_method_name'"
                        :onChange="debouncePayments"
                      />
                    </div>

                    <div class="col-span-12">
                      <div class="form-group-border active">
                        <i class="pi pi-calendar"></i>
                        <input
                          type="date"
                          name="created_at_from"
                          @input="debouncePayments"
                          placeholder=" "
                        />
                        <label>{{ $t("created_at_from") }}</label>
                      </div>
                    </div>

                    <div class="col-span-12">
                      <div class="form-group-border active">
                        <i class="pi pi-calendar"></i>
                        <input
                          type="date"
                          name="created_at_to"
                          @input="debouncePayments"
                          placeholder=" "
                        />
                        <label>{{ $t("created_at_to") }}</label>
                      </div>
                    </div>

                    <div class="col-span-12">
                      <div class="form-group-border select active label-active">
                        <i class="pi pi-clock"></i>
                        <select @change="debouncePayments" name="is_paid">
                          <option selected disabled value="">
                            {{ $t("choose_a_status") }}
                          </option>
                          <option value="1">
                            {{ $t("pages.payment-result.success_alt") }}
                          </option>
                          <option value="0">
                            {{ $t("pages.payment-result.fail_alt") }}
                          </option>
                        </select>
                        <label>{{ $t("status") }}</label>
                      </div>
                    </div>

                    <div class="col-span-12">
                      <div class="btn-wrap">
                        <button
                          type="submit"
                          class="btn btn-sm btn-outline-primary"
                        >
                          <i class="pi pi-undo"></i>
                          {{ $t("reset_search_filter") }}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </stickyBox>
      </div>

      <div class="col-span-12" :class="searchFilter && 'lg:col-span-9'">
        <template v-if="payments.data?.length > 0">
          <div class="table table-striped table-sm selectable">
            <loader v-if="pendingPayments" :className="'overlay'" />
            <table ref="tableRef">
              <thead>
                <tr>
                  <sortTableHead
                    v-for="(head, index) in paymentsTableHeads"
                    :key="index"
                    :title="head.title"
                    :keyName="head.keyName"
                    :sortKey="sortKey"
                    :sortDirection="sortDirection"
                    :sortType="head.sortType"
                    :sortHandler="debouncePayments"
                    @update:sortKey="sortKey = $event"
                    @update:sortDirection="sortDirection = $event"
                  />
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="payment in payments.data"
                  :key="payment.file_id"
                  @click="getPayment(payment)"
                >
                  <td>{{ formatToInvoiceNumber(payment.payment_id) }}</td>
                  <td>
                    {{
                      payment.sum.toLocaleString("ru-RU", {
                        minimumFractionDigits: 2,
                      })
                    }}
                    {{ $contacts.bank.currency.symbol }}
                  </td>
                  <td v-html="payment.school_name"></td>
                  <td v-html="payment.full_school_name"></td>
                  <td v-html="payment.bin"></td>
                  <td>{{ payment.subscription_plan_name }}</td>
                  <td>{{ payment.payment_method_name }}</td>
                  <td>
                    {{
                      new Date(payment.created_at).toLocaleString(undefined, {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false, // можно убрать или поставить true, если нужен 12-часовой формат
                      })
                    }}
                  </td>
                  <td :class="payment.is_paid ? 'text-success' : 'text-danger'">
                    <b>
                      {{
                        payment.is_paid
                          ? $t("pages.payment-result.success_alt")
                          : $t("pages.payment-result.fail_alt")
                      }}</b
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="btn-wrap mt-4">
            <pagination
              :items="payments"
              :setItems="getPayments"
              :onSelect="(count) => (perPage = count)"
            />
          </div>
        </template>

        <alert v-else :className="'light'">
          <loader v-if="pendingPayments" :className="'overlay'" />
          <p class="mb-0">{{ $t("nothing_was_found_for_your_query") }}</p>
        </alert>
      </div>
    </div>
  </div>

  <modal
    :show="paymentModalIsVisible"
    :onClose="() => closePaymentModal()"
    :className="'modal-2xl'"
    :showLoader="pendingPayment"
    :closeOnClickSelf="true"
  >
    <template v-if="currentPayment" v-slot:header_content>
      <h3>
        {{ $t("pages.invoices.num") }}:
        {{ formatToInvoiceNumber(currentPayment.payment_id) }}
      </h3>
    </template>
    <template v-if="currentPayment" v-slot:body_content>
      <div class="custom-grid">
        <div class="col-span-12">
          <div class="flex flex-col gap-y-3">
            <p class="mb-0">
              <span class="text-inactive"
                >{{ $t("pages.payment.methods.invoice.document.summ") }}:
              </span>
              <b
                >{{
                  currentPayment.sum.toLocaleString("ru-RU", {
                    minimumFractionDigits: 2,
                  })
                }}
                {{ $contacts.bank.currency.symbol }}</b
              >
            </p>

            <p class="mb-0">
              <span class="text-inactive">{{ $t("form.school_name") }}: </span>
              <b v-html="currentPayment.school_name"></b>
            </p>

            <p class="mb-0">
              <span class="text-inactive"
                >{{ $t("form.full_school_name") }}:
              </span>
              <b v-html="currentPayment.full_school_name"></b>
            </p>

            <p class="mb-0">
              <span class="text-inactive">{{ $t("form.bin") }}: </span>
              <b>{{ currentPayment.bin }}</b>
            </p>

            <p class="mb-0">
              <span class="text-inactive"
                >{{ $t("pages.subscription.plan") }}:
              </span>
              <b
                >{{ currentPayment.subscription_plan_name }} ({{
                  new Date(currentPayment.accepted_at).toLocaleDateString()
                }}
                -
                {{
                  new Date(currentPayment.expiration_at).toLocaleDateString()
                }})</b
              >
            </p>

            <p class="mb-0">
              <span class="text-inactive"
                >{{ $t("pages.payment.payment_method") }}:
              </span>
              <b>{{ currentPayment.payment_method_name }}</b>
            </p>

            <p class="mb-0">
              <span class="text-inactive">{{ $t("iniciator") }}: </span>
              <b
                >{{ currentPayment.iniciator_last_name }}
                {{ currentPayment.iniciator_first_name }}</b
              >
            </p>

            <p v-if="currentPayment.operator_first_name" class="mb-0">
              <span class="text-inactive">{{ $t("operator") }}: </span>
              <b
                >{{ currentPayment.operator_last_name }}
                {{ currentPayment.operator_first_name }}</b
              >
            </p>

            <p class="mb-0">
              <span class="text-inactive">{{ $t("created_at") }}: </span>
              <b>{{
                new Date(currentPayment.created_at).toLocaleString(undefined, {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false, // можно убрать или поставить true, если нужен 12-часовой формат
                })
              }}</b>
            </p>

            <p class="mb-0">
              <span class="text-inactive">{{ $t("status") }}: </span>
              <b
                :class="currentPayment.is_paid ? 'text-success' : 'text-danger'"
                >{{
                  currentPayment.is_paid
                    ? $t("pages.payment-result.success_alt")
                    : $t("pages.payment-result.fail_alt")
                }}</b
              >
            </p>

            <button
              v-if="
                !currentPayment.is_paid &&
                currentPayment.payment_method_slug === 'invoice'
              "
              class="btn btn-primary"
              @click="acceptPayment()"
            >
              <i class="pi pi-money-bill"></i>
              {{ $t("pages.payment.methods.invoice.accept.title") }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </modal>

  <modal
    :show="acceptPaymentModalIsVisible"
    :onClose="() => closeAcceptPaymentModal()"
    :className="'modal-lg'"
    :showLoader="pendingAccept"
    :closeOnClickSelf="true"
  >
    <template v-slot:header_content>
      <h4>{{ $t("pages.payment.methods.invoice.accept.title") }}</h4>
    </template>
    <template v-if="currentPayment" v-slot:body_content>
      <p>{{ $t("pages.payment.methods.invoice.accept.confirm") }}</p>
      <div class="btn-wrap justify-end mt-4">
        <button
          @click="acceptPaymentSubmit(currentPayment.payment_id)"
          class="btn btn-outline-danger"
        >
          <i class="pi pi-receipt"></i>
          {{ $t("yes") }}
        </button>
        <button @click="closeAcceptPaymentModal()" class="btn btn-light">
          <i class="pi pi-ban"></i>
          {{ $t("no") }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import modal from "../../../components/ui/modal.vue";
import loader from "../../../../components/ui/loader.vue";
import { debounceHandler } from "../../../utils/debounceHandler";
import { formatToInvoiceNumber } from "../../../utils/formatToInvoiceNumber";
import { useRouter } from "nuxt/app";
import stickyBox from "../../../components/ui/stickyBox.vue";
import pagination from "../../../components/ui/pagination.vue";
import multipleSelect from "../../../components/ui/multipleSelect.vue";
import sortTableHead from "../../../components/ui/sortTableHead.vue";
import alert from "../../../components/ui/alert.vue";

const { t } = useI18n();
const router = useRouter();

const { $axiosPlugin } = useNuxtApp();
const pending = ref(true);
const pendingPayments = ref(false);
const pendingPayment = ref(false);
const pendingAccept = ref(false);
const tableRef = ref(null);
const searchFormRef = ref(null);
const searchFilter = ref(false);

const attributes = ref([]);
const payments = ref([]);
const currentPayment = ref(null);

const perPage = ref(10);
const sortKey = ref("payments.payment_id"); // Ключ сортировки
const sortDirection = ref("asc"); // Направление сортировки: asc или desc

const paymentModalIsVisible = ref(false);
const acceptPaymentModalIsVisible = ref(false);

const paymentsTableHeads = [
  {
    title: t("pages.invoices.num"),
    keyName: "payments.payment_id",
    sortType: "numeric",
  },
  {
    title: t("pages.payment.methods.invoice.document.summ"),
    keyName: "payments.sum",
    sortType: "numeric",
  },
  {
    title: t("form.school_name"),
    keyName: "schools.school_name",
    sortType: "alpha",
  },
  {
    title: t("form.full_school_name"),
    keyName: "school.full_school_name",
    sortType: "alpha",
  },
  {
    title: t("form.bin"),
    keyName: "schools.bin",
    sortType: "numeric",
  },
  {
    title: t("pages.subscription.plan"),
    keyName: "types_of_subscription_plans_lang.subscription_plan_name",
    sortType: "alpha",
  },
  {
    title: t("pages.payment.payment_method"),
    keyName: "payment_methods_lang.payment_method_name",
    sortType: "alpha",
  },
  {
    title: t("created_at"),
    keyName: "payments.created_at",
    sortType: "numeric",
  },
  {
    title: t("status"),
    keyName: "payments.is_paid",
    sortType: "alpha",
  },
];

useHead(() => ({
  title: t("pages.invoices.title"),
  meta: [{ name: "description", content: "Invoices" }],
}));

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const getAttributes = async () => {
  pending.value = true;

  await $axiosPlugin
    .get("payment/get_attributes")
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

const getPayments = async (url) => {
  pendingPayments.value = true;

  const formData = new FormData(searchFormRef.value);
  formData.append("per_page", perPage.value);
  formData.append("sort_key", sortKey.value); // Добавляем ключ сортировки
  formData.append("sort_direction", sortDirection.value); // Добавляем направление сортировки

  if (!url) {
    url = "payment/get_payments";
  }

  await $axiosPlugin
    .post(url, formData)
    .then((response) => {
      payments.value = response.data;
      pendingPayments.value = false;
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

const getPayment = (payment) => {
  currentPayment.value = payment;
  paymentModalIsVisible.value = true;
};

const acceptPayment = () => {
  paymentModalIsVisible.value = false;
  acceptPaymentModalIsVisible.value = true;
};

const closeAcceptPaymentModal = () => {
  pendingAccept.value = false;
  acceptPaymentModalIsVisible.value = false;
  paymentModalIsVisible.value = true;
};

const acceptPaymentSubmit = async (payment_id) => {
  pendingAccept.value = true;
  const formData = new FormData();
  formData.append("operation_type_id", 30);

  await $axiosPlugin
    .post("payment/accept_payment/" + payment_id, formData)
    .then((response) => {
      if (response.data.success === true) {
        getPayments().then(() => {
          currentPayment.value = payments.value.data.find(
            (p) => (p.payment_id = payment_id)
          );
          closeAcceptPaymentModal();
        });
      }
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

const closePaymentModal = () => {
  paymentModalIsVisible.value = false;
  currentPayment.value = null;
};

const showHideFileSearchFilter = () => {
  if (searchFilter.value === true) {
    searchFilter.value = false;
    resetFileSearchFilter();
  } else {
    searchFilter.value = true;
  }
};

const resetFileSearchFilter = () => {
  searchFormRef.value.reset();
  getPayments();
};

const debouncePayments = debounceHandler(() => getPayments(), 1000);
const debounceReset = debounceHandler(() => resetFileSearchFilter(), 500);

onMounted(() => {
  getAttributes();
  getPayments();
});
</script>
