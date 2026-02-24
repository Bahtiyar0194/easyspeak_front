<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <cardPayment :errors="errors" />
    </div>
    <div class="col-span-12">
      <p class="text-xl mb-0 text-right">
        {{ $t("total") }}:
        <b>
          0
          {{ $contacts.bank.currency.symbol }}</b
        >
      </p>
    </div>
  </div>
</template>
<script setup>
import cardPayment from "../cardPayment.vue";
const props = defineProps({
  errors: {
    type: Object,
    required: true,
  },
});

const { errors } = toRefs(props);
</script>
