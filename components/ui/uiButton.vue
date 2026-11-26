<template>
  <button
    :type="props.type"
    class="btn"
    :class="[
      props.variant && `btn-${props.variant}`,
      props.size && `btn-${props.size}`,
      props.shape && `btn-${props.shape}`,
      { full: props.full, loading: props.loading },
    ]"
    :disabled="props.disabled || props.loading"
    :aria-busy="props.loading || undefined"
  >
    <i v-if="props.icon" :class="props.icon" aria-hidden="true"></i>
    <slot />
  </button>
</template>

<script setup>
// Единая кнопка для новых мест. Существующие <button class="btn ..."> менять
// не обязательно — компонент собирает те же CSS-классы из main.css.
//
// <uiButton variant="primary" :loading="pending" icon="pi pi-check" type="submit">
//   {{ $t("save") }}
// </uiButton>
const props = defineProps({
  // primary | light | danger | success | outline-primary | outline-danger |
  // outline-success | inactive | active | white | transparent
  variant: { type: String, default: "light" },
  // xs | sm | lg (по умолчанию — средний)
  size: { type: String, default: "" },
  // square | circle — для кнопок-иконок
  shape: { type: String, default: "" },
  type: { type: String, default: "button" },
  icon: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  full: { type: Boolean, default: false },
});
</script>
