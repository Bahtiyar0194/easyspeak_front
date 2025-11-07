<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <div class="form-group-border select active label-active">
        <i class="pi pi-calendar"></i>
        <select v-model="selectedPlan">
          <option selected disabled value="">
            {{ $t("pages.subscription.choose_a_plan") }}
          </option>

          <option
            v-for="plan in plans"
            :key="plan.subscription_plan_id"
            :value="plan.subscription_plan_id"
          >
            {{ plan.subscription_plan_name }} - {{
              plan.price.toLocaleString("ru-RU")
            }}
            {{ $contacts.bank.currency.symbol }}
          </option>
        </select>
        <label :class="{ 'label-error': errors.subscription_plan_id }">
          {{
            errors.subscription_plan_id
              ? $t("pages.subscription.choose_a_plan")
              : $t("pages.subscription.plan")
          }}
        </label>
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
  plans: {
    type: Object,
    required: true,
  },
  selectedPlan: {
    type: Object,
    required: true,
  },
});

const { errors, plans, selectedPlan } = toRefs(props);
</script>
