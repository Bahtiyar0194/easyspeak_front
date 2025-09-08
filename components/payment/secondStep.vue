<template>
  <div class="custom-grid my-8">
    <div class="col-span-12">
      <div class="custom-grid">
        <div
          class="col-span-12 md:col-span-6"
          v-for="method in paymentMethods"
          :key="method"
        >
          <button
            @click="currentPaymentMethod = method"
            type="button"
            class="p-6 w-full rounded-xl flex flex-col gap-y-2 items-center"
            :class="
              currentPaymentMethod === method
                ? 'bg-corp text-white border-corp'
                : 'bg-inactive border-inactive'
            "
          >
            <img class="w-12" :src="'/images/' + method + '.svg'" />
            {{ $t("pages.payment.methods." + method + ".title") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  errors: {
    type: Object,
    required: true,
  },

  paymentMethods: {
    type: Object,
    required: true,
  },

  currentPaymentMethod: {
    type: Object,
    required: true,
  },
});

const { errors, paymentMethods, currentPaymentMethod } = toRefs(props);
</script>
