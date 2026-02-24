<template>
  <div class="col-span-12">
    <p class="mb-0">
      <b>
        {{
          $t("step_num", {
            num: props.num,
          })
        }}: {{ props.title }}</b
      >
    </p>
  </div>
</template>
<script setup>
const props = defineProps({
  num: {
    type: Number,
    required: true,
  },

  title: {
    type: String,
    required: true,
  },
});
</script>
