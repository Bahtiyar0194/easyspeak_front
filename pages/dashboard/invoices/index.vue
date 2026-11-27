<template>
  <div class="col-span-12">
    <div class="custom-grid">
      <!-- Сводка: что ждёт подтверждения и сколько оплачено за месяц -->
      <div class="col-span-12">
        <div class="invoice-stats" :aria-busy="pendingSummary || undefined">
          <button
            type="button"
            class="invoice-stat"
            :class="{ active: status === 'pending', attention: summary?.pending_count > 0 }"
            :aria-pressed="status === 'pending'"
            @click="setStatus(status === 'pending' ? '' : 'pending')"
          >
            <span class="invoice-stat-icon text-warning" aria-hidden="true">
              <i class="pi pi-hourglass"></i>
            </span>
            <span class="min-w-0 flex flex-col">
              <span class="text-xs text-inactive">{{ $t("pages.invoices.summary_pending") }}</span>
              <template v-if="summary">
                <b class="invoice-stat-value">{{ summary.pending_count }}</b>
                <span class="text-xs text-inactive truncate">{{
                  formatMoney(summary.pending_amount)
                }}</span>
              </template>
              <template v-else>
                <span class="skeleton block w-10 h-6 my-0.5"></span>
                <span class="skeleton block w-20 h-3"></span>
              </template>
            </span>
          </button>

          <button
            type="button"
            class="invoice-stat"
            :class="{ active: status === 'paid' }"
            :aria-pressed="status === 'paid'"
            @click="setStatus(status === 'paid' ? '' : 'paid')"
          >
            <span class="invoice-stat-icon text-success" aria-hidden="true">
              <i class="pi pi-check-circle"></i>
            </span>
            <span class="min-w-0 flex flex-col">
              <span class="text-xs text-inactive">{{ $t("pages.invoices.summary_paid_month") }}</span>
              <template v-if="summary">
                <b class="invoice-stat-value truncate">{{
                  formatMoney(summary.paid_month_amount)
                }}</b>
                <span class="text-xs text-inactive">{{
                  $t("pages.invoices.payments_count", { count: summary.paid_month_count })
                }}</span>
              </template>
              <template v-else>
                <span class="skeleton block w-24 h-6 my-0.5"></span>
                <span class="skeleton block w-16 h-3"></span>
              </template>
            </span>
          </button>
        </div>
      </div>

      <!-- Панель: фильтр, быстрый выбор статуса, сколько найдено -->
      <div class="col-span-12">
        <div class="list-toolbar">
          <button
            type="button"
            @click="showHideSearchFilter"
            class="btn"
            :class="searchFilter ? 'btn-outline-primary' : 'btn-light'"
            :aria-pressed="searchFilter"
            :title="searchFilter ? $t('hide_search_filter') : $t('show_search_filter')"
          >
            <i class="pi pi-filter" aria-hidden="true"></i>
            {{ $t("filter") }}
          </button>

          <div class="type-chips" role="group" :aria-label="$t('status')">
            <button
              v-for="chip in statusChips"
              :key="chip.value"
              type="button"
              class="type-chip"
              :class="{ active: status === chip.value }"
              :aria-pressed="status === chip.value"
              @click="setStatus(chip.value)"
            >
              <i v-if="chip.icon" :class="[chip.icon, chip.color]" aria-hidden="true"></i>
              {{ chip.label }}
            </button>
          </div>

          <span v-if="payments.total" class="text-sm text-inactive ml-auto">
            {{ $t("found") }}: <b class="text-active">{{ payments.total }}</b>
          </span>
        </div>
      </div>

      <div
        class="col-span-12 lg:col-span-3"
        :class="searchFilter ? 'block' : 'hidden'"
      >
        <stickyBox>
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
                      inputmode="numeric"
                      autocomplete="off"
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
                      autocomplete="off"
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
                      autocomplete="off"
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
                      type="text"
                      name="bin"
                      inputmode="numeric"
                      autocomplete="off"
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
                  <button type="submit" class="btn btn-light full">
                    <i class="pi pi-filter-slash" aria-hidden="true"></i>
                    {{ $t("reset_search_filter") }}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </stickyBox>
      </div>

      <div
        ref="listTopRef"
        class="col-span-12 relative scroll-mt-24"
        :class="searchFilter && 'lg:col-span-9'"
      >
        <!-- Скелетон: первая загрузка или переход на другую страницу -->
        <listSkeleton
          v-if="pendingPayments && (paging || !payments.data?.length)"
          :columns="paymentsTableHeads.length"
          :rows="paging ? skeletonRows : 8"
          :statusColumn="true"
        />

        <!-- Фильтр / сортировка: список на месте, по нему перелив -->
        <div
          v-else-if="payments.data?.length > 0"
          :class="{ 'list-refreshing': pendingPayments }"
          :aria-busy="pendingPayments || undefined"
        >
          <span v-if="pendingPayments" class="sr-only">{{ $t("loading") }}</span>

          <!-- Компьютер: таблица -->
          <div class="table table-striped table-sm selectable max-md:!hidden">
            <table>
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
                  :key="payment.payment_id"
                  @click="getPayment(payment)"
                >
                  <td class="whitespace-nowrap font-medium">
                    {{ formatToInvoiceNumber(payment.payment_id) }}
                  </td>
                  <td class="whitespace-nowrap font-semibold">
                    {{ formatMoney(payment.sum) }}
                  </td>
                  <td>
                    <span class="flex flex-col min-w-0">
                      <span class="font-medium">{{ decodeEntities(payment.school_name) }}</span>
                      <span
                        v-if="payment.full_school_name && payment.full_school_name !== payment.school_name"
                        class="text-xs text-inactive"
                        >{{ decodeEntities(payment.full_school_name) }}</span
                      >
                    </span>
                  </td>
                  <td class="whitespace-nowrap">{{ payment.bin }}</td>
                  <td>{{ payment.subscription_plan_name }}</td>
                  <td>{{ payment.payment_method_name }}</td>
                  <td class="whitespace-nowrap">{{ formatDateTime(payment.created_at) }}</td>
                  <td>
                    <span class="status-pill" :class="statusOf(payment).color">
                      {{ statusOf(payment).label }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Телефон: карточки -->
          <ul class="entity-list md:hidden">
            <li v-for="payment in payments.data" :key="payment.payment_id">
              <button
                type="button"
                class="entity-card"
                @click="getPayment(payment)"
              >
                <span
                  class="invoice-stat-icon !w-10 !h-10"
                  :class="statusOf(payment).color"
                  aria-hidden="true"
                >
                  <i :class="statusOf(payment).icon"></i>
                </span>
                <span class="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
                  <span class="flex items-baseline justify-between gap-2">
                    <span class="font-semibold truncate">{{
                      decodeEntities(payment.school_name)
                    }}</span>
                    <b class="whitespace-nowrap">{{ formatMoney(payment.sum) }}</b>
                  </span>
                  <span class="text-xs text-inactive truncate">
                    {{ $t("pages.invoices.num") }} {{ formatToInvoiceNumber(payment.payment_id) }}
                    · {{ payment.subscription_plan_name }}
                  </span>
                  <span class="text-xs text-inactive">
                    {{ payment.payment_method_name }} · {{ formatDateTime(payment.created_at) }}
                  </span>
                  <span class="status-pill wrap mt-1" :class="statusOf(payment).color">
                    {{ statusOf(payment).label }}
                  </span>
                </span>
                <i class="pi pi-chevron-right text-inactive text-xs" aria-hidden="true"></i>
              </button>
            </li>
          </ul>
        </div>

        <emptyState
          v-else-if="filtered"
          :text="$t('nothing_was_found_for_your_query')"
          icon="bi bi-search"
        />
        <emptyState
          v-else
          :text="$t('pages.invoices.no_invoices')"
          icon="bi bi-receipt"
        />

        <!-- Вне блока списка: при переходе по страницам остаётся на месте -->
        <div
          v-if="payments.data?.length"
          class="btn-wrap mt-4"
          :class="{ 'pointer-events-none opacity-60': pendingPayments }"
        >
          <pagination
            :items="payments"
            :setItems="getPayments"
            :onSelect="(count) => (perPage = count)"
          />
        </div>
      </div>
    </div>
  </div>

  <modal
    :show="paymentModalIsVisible"
    :onClose="() => closePaymentModal()"
    :className="'modal-2xl'"
    :closeOnClickSelf="!pendingAccept"
  >
    <template v-if="currentPayment" v-slot:header_content>
      <h4 class="mb-0">
        {{ $t("pages.invoices.num") }}
        {{ formatToInvoiceNumber(currentPayment.payment_id) }}
      </h4>
    </template>
    <template v-if="currentPayment" v-slot:body_content>
      <div class="flex flex-col gap-4">
        <!-- Главное: сумма и статус -->
        <div class="invoice-head">
          <div class="min-w-0">
            <p class="mb-0 text-xs text-inactive">
              {{ $t("pages.payment.methods.invoice.document.summ") }}
            </p>
            <p class="mb-0 text-2xl font-bold text-active">
              {{ formatMoney(currentPayment.sum) }}
            </p>
          </div>
          <span class="status-pill wrap" :class="statusOf(currentPayment).color">
            <i :class="statusOf(currentPayment).icon" class="mr-1" aria-hidden="true"></i>
            {{ statusOf(currentPayment).label }}
          </span>
        </div>

        <dl class="school-dl">
          <dt>{{ $t("form.school_name") }}</dt>
          <dd>{{ decodeEntities(currentPayment.school_name) }}</dd>

          <dt>{{ $t("form.full_school_name") }}</dt>
          <dd>{{ decodeEntities(currentPayment.full_school_name) }}</dd>

          <dt>{{ $t("form.bin") }}</dt>
          <dd>{{ currentPayment.bin }}</dd>

          <dt>{{ $t("pages.subscription.plan") }}</dt>
          <dd>
            {{ currentPayment.subscription_plan_name }}
            <span
              v-if="currentPayment.accepted_at && currentPayment.expiration_at"
              class="block text-xs text-inactive font-normal"
            >
              {{ $t("pages.invoices.period") }}:
              {{ formatDate(currentPayment.accepted_at) }} —
              {{ formatDate(currentPayment.expiration_at) }}
            </span>
          </dd>

          <dt>{{ $t("pages.payment.payment_method") }}</dt>
          <dd>{{ currentPayment.payment_method_name }}</dd>

          <template v-if="currentPayment.iniciator_first_name">
            <dt>{{ $t("iniciator") }}</dt>
            <dd>
              {{ currentPayment.iniciator_last_name }}
              {{ currentPayment.iniciator_first_name }}
            </dd>
          </template>

          <template v-if="currentPayment.operator_first_name">
            <dt>{{ $t("operator") }}</dt>
            <dd>
              {{ currentPayment.operator_last_name }}
              {{ currentPayment.operator_first_name }}
            </dd>
          </template>

          <dt>{{ $t("created_at") }}</dt>
          <dd>{{ formatDateTime(currentPayment.created_at) }}</dd>
        </dl>

        <div v-if="statusOf(currentPayment).key === 'pending'" class="invoice-accept">
          <p class="mb-0 text-sm text-inactive">
            {{ $t("pages.invoices.accept_hint") }}
          </p>
          <button
            type="button"
            class="btn btn-primary"
            :class="{ loading: pendingAccept }"
            :disabled="pendingAccept"
            @click="acceptPayment"
          >
            <i class="pi pi-check" aria-hidden="true"></i>
            {{ $t("pages.payment.methods.invoice.accept.title") }}
          </button>
        </div>
      </div>
    </template>
  </modal>
</template>

<script setup>
import modal from "../../../components/ui/modal.vue";
import { debounceHandler } from "../../../utils/debounceHandler";
import { formatToInvoiceNumber } from "../../../utils/formatToInvoiceNumber";
import { decodeEntities } from "../../../utils/decodeEntities";
import { useRouter } from "nuxt/app";
import stickyBox from "../../../components/ui/stickyBox.vue";
import pagination from "../../../components/ui/pagination.vue";
import multipleSelect from "../../../components/ui/multipleSelect.vue";
import sortTableHead from "../../../components/ui/sortTableHead.vue";
import listSkeleton from "../../../components/ui/listSkeleton.vue";
import emptyState from "~/components/ui/emptyState.vue";
import { useNotify } from "~/composables/useNotify";
import { useConfirm } from "~/composables/useConfirm";

const { t, locale } = useI18n();
const router = useRouter();
const notify = useNotify();
const confirm = useConfirm();

const { $axiosPlugin, $contacts } = useNuxtApp();
const pendingPayments = ref(true);
const pendingSummary = ref(false);
const pendingAccept = ref(false);
const searchFormRef = ref(null);
const searchFilter = ref(false);

const attributes = ref([]);
const payments = ref([]);
const summary = ref(null);
const currentPayment = ref(null);

const perPage = ref(10);
// Новые сверху — свежие счета обычно и нужно подтверждать
const sortKey = ref("payments.created_at");
const sortDirection = ref("desc");

// Быстрый фильтр по статусу: '' | pending | paid | failed
const status = ref("");
// Есть ли условия поиска — чтобы отличить «ничего не найдено» от «счетов нет»
const filtered = ref(false);

const paymentModalIsVisible = ref(false);

const paymentsTableHeads = [
  { title: t("pages.invoices.num"), keyName: "payments.payment_id", sortType: "numeric" },
  { title: t("pages.payment.methods.invoice.document.summ"), keyName: "payments.sum", sortType: "numeric" },
  { title: t("pages.invoices.school"), keyName: "schools.school_name", sortType: "alpha" },
  { title: t("form.bin"), keyName: "schools.bin", sortType: "numeric" },
  { title: t("pages.subscription.plan"), keyName: "types_of_subscription_plans_lang.subscription_plan_name", sortType: "alpha" },
  { title: t("pages.payment.payment_method"), keyName: "payment_methods_lang.payment_method_name", sortType: "alpha" },
  { title: t("created_at"), keyName: "payments.created_at", sortType: "numeric" },
  { title: t("status"), keyName: "payments.is_paid", sortType: "alpha" },
];

const STATUSES = {
  paid: { key: "paid", color: "text-success", icon: "pi pi-check-circle", label: "pages.invoices.status.paid" },
  pending: { key: "pending", color: "text-warning", icon: "pi pi-hourglass", label: "pages.invoices.status.pending" },
  failed: { key: "failed", color: "text-danger", icon: "pi pi-times-circle", label: "pages.invoices.status.failed" },
};

// Неоплаченный счёт ждёт подтверждения вручную; неоплаченная оплата картой —
// это не прошедший платёж (раньше оба показывались как «Ошибка»)
const statusOf = (payment) => {
  const s = payment.is_paid
    ? STATUSES.paid
    : payment.payment_method_slug === "invoice"
      ? STATUSES.pending
      : STATUSES.failed;
  return { ...s, label: t(s.label) };
};

const statusChips = computed(() => [
  { value: "", label: t("pages.invoices.status.all") },
  ...["pending", "paid", "failed"].map((key) => ({
    value: key,
    label: t(STATUSES[key].label),
    icon: STATUSES[key].icon,
    color: STATUSES[key].color,
  })),
]);

const intlLocale = computed(() => String(locale.value || "ru").split("-")[0]);

const formatMoney = (value) =>
  Number(value || 0).toLocaleString(intlLocale.value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) +
  " " +
  ($contacts?.bank?.currency?.symbol || "");

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(intlLocale.value, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(intlLocale.value) : "";

useHead(() => ({
  title: t("pages.invoices.title"),
  meta: [{ name: "description", content: "Invoices" }],
}));

definePageMeta({
  layout: "dashboard",
  middleware: ["sanctum:auth"],
});

const goToError = (err) => {
  if (err.response) {
    router.push({
      path: "/error",
      query: {
        status: err.response.status,
        message: err.response.data?.message,
        url: err.request?.responseURL,
      },
    });
  } else {
    router.push("/error");
  }
};

const getAttributes = async () => {
  await $axiosPlugin
    .get("payment/get_attributes")
    .then((response) => {
      attributes.value = response.data;
    })
    .catch(goToError);
};

const getSummary = async () => {
  pendingSummary.value = true;
  await $axiosPlugin
    .get("payment/get_payments_summary")
    .then((response) => {
      summary.value = response.data;
    })
    .catch(goToError)
    .finally(() => {
      pendingSummary.value = false;
    });
};

// Переход по страницам: пагинация передаёт url страницы — тогда скелетон
const paging = ref(false);
const skeletonRows = ref(8);
const listTopRef = ref(null);

// Номер последнего запроса: при быстрых переключениях фильтра ответ на
// устаревший запрос не должен перетирать свежий
let requestSeq = 0;

const getPayments = async (url) => {
  pendingPayments.value = true;
  paging.value = Boolean(url);
  const seq = ++requestSeq;

  if (paging.value) {
    skeletonRows.value = payments.value.data?.length || 8;
    const top = listTopRef.value?.getBoundingClientRect().top;
    if (top !== undefined && top < 0) {
      listTopRef.value.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const formData = new FormData(searchFormRef.value || undefined);
  filtered.value =
    Boolean(status.value) ||
    [...formData.values()].some((v) => typeof v === "string" && v.trim() !== "");

  formData.append("per_page", perPage.value);
  formData.append("sort_key", sortKey.value);
  formData.append("sort_direction", sortDirection.value);
  if (status.value) formData.append("status", status.value);

  await $axiosPlugin
    .post(url || "payment/get_payments", formData)
    .then((response) => {
      if (seq !== requestSeq) return;
      payments.value = response.data;
      pendingPayments.value = false;
      paging.value = false;
    })
    .catch((err) => {
      if (seq === requestSeq) goToError(err);
    });
};

const setStatus = (value) => {
  if (status.value === value) return;
  status.value = value;
  getPayments();
};

const getPayment = (payment) => {
  currentPayment.value = payment;
  paymentModalIsVisible.value = true;
};

const closePaymentModal = () => {
  if (pendingAccept.value) return;
  paymentModalIsVisible.value = false;
};

// Подтверждение прямо в окне счёта: спрашиваем, отправляем, обновляем статус
// на месте, список и сводку
const acceptPayment = async () => {
  const payment = currentPayment.value;
  if (!payment || pendingAccept.value) return;

  const ok = await confirm({
    title: t("pages.payment.methods.invoice.accept.title"),
    message: t("pages.invoices.accept_confirm", {
      num: formatToInvoiceNumber(payment.payment_id),
      sum: formatMoney(payment.sum),
      school: decodeEntities(payment.school_name),
    }),
    confirmText: t("pages.invoices.accept_yes"),
  });
  if (!ok) return;

  pendingAccept.value = true;
  const formData = new FormData();
  formData.append("operation_type_id", 30);

  await $axiosPlugin
    .post("payment/accept_payment/" + payment.payment_id, formData)
    .then(() => {
      notify("success", t("pages.invoices.accepted"));
    })
    .catch((err) => {
      const code = err.response?.status;
      if (code === 409) {
        notify("warning", t("pages.invoices.already_accepted"));
      } else if (code === 403) {
        notify("danger", t("errors.no_permission"));
      } else if (code === 404) {
        notify("danger", t("pages.invoices.not_found"));
      } else {
        notify("danger", t("pages.invoices.accept_error"));
      }
    });

  await Promise.all([getPayments(), getSummary()]);
  pendingAccept.value = false;

  // Окно показывает актуальные данные: из обновлённого списка, а если счёт
  // ушёл из него из-за фильтра — отмечаем оплаченным сами
  const fresh = payments.value.data?.find((p) => p.payment_id === payment.payment_id);
  if (paymentModalIsVisible.value && currentPayment.value?.payment_id === payment.payment_id) {
    currentPayment.value = fresh || { ...payment, is_paid: 1 };
  }
};

const showHideSearchFilter = () => {
  if (searchFilter.value === true) {
    searchFilter.value = false;
    resetSearchFilter();
  } else {
    searchFilter.value = true;
  }
};

const resetSearchFilter = () => {
  searchFormRef.value?.reset();
  getPayments();
};

const debouncePayments = debounceHandler(() => getPayments(), 1000);
const debounceReset = debounceHandler(() => resetSearchFilter(), 500);

onMounted(() => {
  getAttributes();
  getSummary();
  getPayments();
});
</script>
