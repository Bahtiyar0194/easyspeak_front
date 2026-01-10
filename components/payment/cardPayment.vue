<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <div class="border-inactive bg-inactive overflow-hidden rounded-2xl">
        <div class="custom-grid">
          <div class="col-span-12">
            <div class="custom-grid !gap-0">
              <div class="col-span-12 md:col-span-8">
                <div
                  class="border-inactive !border-l-0 !border-t-0 md:!border-b-0 !border-r-0 md:!border-r bg-active py-10 px-6 rounded-2xl"
                >
                  <div class="custom-grid">
                    <div class="col-span-12">
                      <div class="form-group-border active">
                        <i class="pi pi-credit-card"></i>
                        <input
                          data-cp="cardNumber"
                          v-mask="'#### #### #### ####'"
                          placeholder=" "
                        />
                        <label
                          :class="{
                            'label-error': errors.cardNumber,
                          }"
                        >
                          {{
                            errors.cardNumber
                              ? $t(
                                  "form.card.tiptop.errors." + errors.cardNumber
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
                          :class="{
                            'label-error': errors.expDateMonth,
                          }"
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
                          :class="{
                            'label-error': errors.expDateYear,
                          }"
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
                        :type="showCVV ? 'text' : 'password'"
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
                      <button
                        type="button"
                        @click="showCVV = !showCVV"
                        class="show-password"
                      >
                        <i class="pi pi-eye" v-if="showCVV"></i>
                        <i class="pi pi-eye-slash" v-else></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
});

const { errors } = toRefs(props);

const showCVV = ref(false);
</script>
