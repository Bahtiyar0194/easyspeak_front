<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <cardPayment :errors="errors" />
    </div>
    <div v-if="paymentLessons.length > 0" class="col-span-12">
      <p class="text-xl mb-0 text-right">
        {{ $t("total") }}:
        <b>
          {{
            paymentLessons
              .reduce((sum, item) => sum + item.current_price, 0)
              .toLocaleString("ru-RU")
          }}
          {{ $contacts.bank.currency.symbol }}</b
        >
      </p>
    </div>
  </div>
</template>
<script setup>
import cardPayment from "../cardPayment.vue";
const props = defineProps({
  paymentLessons: {
    type: Object,
    required: true,
  },
  errors: {
    type: Object,
    required: true,
  },
});

const { errors, paymentLessons } = toRefs(props);
</script>
