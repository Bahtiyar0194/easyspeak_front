<template>
  <div
    class="sticky"
    :class="props.className"
    :style="{
      top: (props.offsetTop >= 0 ? props.offsetTop : -10) + 'px',
      bottom: (props.offsetBottom >= 0 ? props.offsetBottom : -10) + 'px',
    }"
  >
    <slot />
  </div>
</template>

<script setup>
const props = defineProps({
  offsetTop: {
    type: Number,
    required: false,
  },

  offsetBottom: {
    type: Number,
    required: false,
  },

  className: {
    type: String,
    required: false,
    default: "",
  },
});
</script>
