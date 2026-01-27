<template>
  <div class="tooltip" :class="[{ show: props.show }, props.className]">
    {{ props.title }}
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },

  show: {
    type: Boolean,
    required: false,
    default: false,
  },

  className: {
    type: String,
    required: false,
    default: "",
  },
});
</script>
