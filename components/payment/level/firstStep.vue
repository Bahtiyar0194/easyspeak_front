<template>
  <div v-if="lessonsData" class="custom-grid">
    <div class="col-span-12">
      <div
        class="text-white p-4 rounded-xl select-none"
        :class="lessonsData.level.has_expired === 1 ? 'bg-danger' : 'bg-corp'"
      >
        <p class="mb-0">
          <b>
            {{
              $t(
                lessonsData.level.has_expired === 1
                  ? "pages.courses.has_expired"
                  : "pages.courses.purchase",
              )
            }}
          </b>
        </p>
      </div>
    </div>
    <stepName :num="1" :title="$t('promo.desc_1')" />

    <div class="col-span-12">
      <div class="form-group-border active label-active w-full">
        <i class="pi pi-tag"></i>
        <input
          class="uppercase"
          autocomplete="new-promo"
          v-model="promoCode"
          @input="debouncePromo()"
          name="promo_code"
          type="text"
          placeholder=" "
        />
        <label :class="{ 'label-error': errors.promo_code }">
          {{
            errors.promo_code
              ? $t("promo.errors." + errors.promo_code[0])
              : $t("promo.code")
          }}
        </label>
      </div>
    </div>

    <stepName :num="2" :title="$t('pages.payment.check_order_data')" />

    <div class="col-span-12">
      <ul class="list-group sm inactive">
        <li>
          <div class="flex gap-x-2 justify-between">
            <span>{{ $t("pages.courses.course") }}:</span>
            <b
              >{{ lessonsData.course.course_name }},
              {{ lessonsData.level.level_name }}</b
            >
          </div>
        </li>

        <li>
          <div class="flex gap-x-2 justify-between">
            <span
              >{{ $t("pages.payment.methods.invoice.document.price") }}:</span
            >
            <b
              >{{ lessonsData.level.price.toLocaleString("ru-RU") }}.00
              {{ $contacts.bank.currency.symbol }}</b
            >
          </div>
        </li>

        <li>
          <div class="flex gap-x-2 justify-between">
            <span>{{ $t("promo.discount") }}:</span>
            <b :class="lessonsData.level.promo_discount ? 'text-success' : ''">
              <animatedNumber
                :number="
                  lessonsData.level.promo_discount
                    ? (lessonsData.level.price / 100) *
                      lessonsData.level.promo_discount
                    : 0
                "
              />.00 {{ $contacts.bank.currency.symbol }} |
              <animatedNumber
                :number="lessonsData.level.promo_discount || 0"
              />%</b
            >
          </div>
        </li>
      </ul>
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
import stepName from "../../ui/stepName.vue";
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

  promoCode: {
    type: Object,
    required: true,
  },

  findPromo: {
    type: Function,
    required: true,
  },

  debouncePromo: {
    type: Function,
    required: true,
  },
});

const { errors, lessonsData, promoCode } = toRefs(props);
</script>
