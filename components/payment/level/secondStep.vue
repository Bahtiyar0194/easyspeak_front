<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <cardPayment :errors="errors" />
    </div>
    <div class="col-span-12">
      <p class="text-xl mb-0 text-right">
        {{ $t("total") }}:
        <b class="font-bold">
          <animatedNumber
            :number="
              lessonsData.level.promo_discount
                ? lessonsData.level.price -
                  (lessonsData.level.price / 100) *
                    lessonsData.level.promo_discount
                : lessonsData.level.price
            "
          />.00 {{ $contacts.bank.currency.symbol }}</b
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
});

const { errors, lessonsData } = toRefs(props);
</script>
