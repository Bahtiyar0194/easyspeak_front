<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <cardPayment :errors="errors" />
    </div>
    <div class="col-span-12">
      <p class="text-xl mb-0 text-right">
        {{ $t("total") }}:
        <b class="font-bold">
          <animatedNumber :number="finalPrice" />.00
          {{ $contacts.bank.currency.symbol }}</b
        >
      </p>
    </div>
  </div>
</template>
<script setup>
import cardPayment from "../cardPayment.vue";
import animatedNumber from "../../ui/animatedNumber.vue";

const props = defineProps({
  errors: {
    type: Object,
    required: true,
  },

  lessonsData: {
    type: Object,
    required: true,
  },

  selectedSubscriptionId: {
    type: Object,
    required: true,
  },
});

const { errors, lessonsData, selectedSubscriptionId } = toRefs(props);

const selectedSubscription = computed(() =>
  lessonsData.value.level.subscription_types.find(
    (s) => s.subscription_type_id === selectedSubscriptionId.value,
  ),
);

const finalPrice = computed(() => {
  const price = selectedSubscription.value?.price ?? 0;
  const discount = lessonsData.value.level.promo_discount ?? 0;

  return discount ? price - (price / 100) * discount : price;
});
</script>
