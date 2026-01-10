<template>
  <div class="custom-grid">
    <div
      :class="currentPaymentMethod === 'invoice' ? 'block' : 'hidden'"
      class="col-span-12"
    >
      <div class="bg-corp text-white p-4 rounded-xl mb-4">
        <p class="mb-2">
          {{ $t("form.full_school_name") }}:
          <b>{{ schoolStore.schoolData.full_school_name }}</b>
        </p>
        <p class="mb-2">
          {{ $t("form.fact_address") }}:
          <b
            >{{ schoolStore.schoolData.location_name }},
            {{ schoolStore.schoolData.street }}
            {{ schoolStore.schoolData.house }}</b
          >
        </p>
        <p class="mb-0">
          {{ $t("form.bin") }}:
          <b>{{ schoolStore.schoolData.bin }}</b>
        </p>
      </div>

      <p class="mb-2">
        {{ $t("pages.payment.methods.invoice.desc_1") }}
      </p>

      <p class="mb-2">
        {{ $t("pages.payment.methods.invoice.desc_2") }}
      </p>
      <p class="mb-2">
        {{ $t("pages.payment.methods.invoice.desc_3") }}
      </p>
    </div>

    <div
      :class="currentPaymentMethod === 'card' ? 'block' : 'hidden'"
      class="col-span-12"
    >
      <cardPayment :errors="errors" />
    </div>

    <div v-if="selectedPlan" class="col-span-12">
      <p class="text-xl mb-2 text-right">
        {{ $t("total") }}:
        <b>
          {{
            plans
              .find((plan) => plan.subscription_plan_id === selectedPlan)
              .price.toLocaleString("ru-RU")
          }}
          {{ $contacts.bank.currency.symbol }}</b
        >
      </p>

      <!-- <p class="text-right mb-0">
        {{
          $t("pages.payment.methods.invoice.document.vat_text", {
            vat: $contacts.vat_percent,
          })
        }}:
        <b>
          {{
            (
              (plans.find((plan) => plan.subscription_plan_id === selectedPlan)
                .price *
                $contacts.vat_percent) /
              (100 + $contacts.vat_percent)
            ).toFixed(2)
          }}
          {{ $contacts.bank.currency.symbol }}</b
        >
      </p> -->
    </div>
  </div>
</template>

<script setup>
import cardPayment from "../cardPayment.vue";
const schoolStore = useSchoolStore();

const props = defineProps({
  errors: {
    type: Object,
    required: true,
  },

  currentPaymentMethod: {
    type: Object,
    required: true,
  },

  plans: {
    type: Object,
    required: true,
  },

  selectedPlan: {
    type: Object,
    required: true,
  },
});

const { errors, currentPaymentMethod, plans, selectedPlan } = toRefs(props);
</script>
