<template>
  <client-only>
    <div class="stepper" :class="{ compact: props.steps.length >= 4 }">
      <ol class="stepper-list">
        <li
          v-for="(step, index) in props.steps"
          :key="index"
          class="stepper-item"
          :class="{
            current: props.currentStep === index + 1,
            completed: props.currentStep > index + 1,
          }"
          :aria-current="props.currentStep === index + 1 ? 'step' : undefined"
        >
          <!-- Линия к следующему шагу: заливается, когда шаг пройден -->
          <span
            v-if="index < props.steps.length - 1"
            class="stepper-line"
            aria-hidden="true"
          ></span>

          <span class="stepper-dot">
            <i
              v-if="props.currentStep > index + 1"
              class="pi pi-check"
              aria-hidden="true"
            ></i>
            <template v-else>{{ index + 1 }}</template>
          </span>
          <span class="stepper-label">{{ step.title }}</span>
        </li>
      </ol>

      <!-- Телефон: подписи под кружками не помещаются — показываем текущий шаг -->
      <p class="stepper-current">
        {{ $t("step") }} {{ props.currentStep }} / {{ props.steps.length }}:
        <b>{{ props.steps[props.currentStep - 1]?.title }}</b>
      </p>
    </div>

    <slot />
  </client-only>
</template>

<script setup>
const props = defineProps({
  currentStep: {
    type: Number,
    required: true,
  },

  steps: {
    type: Array,
    required: true,
  },
});
</script>
