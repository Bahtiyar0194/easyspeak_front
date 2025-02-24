<template>
  <client-only>
    <div class="col-span-12">
      <div :class="props.className ? props.className : 'card p-4'">
        <p v-if="props.title" class="font-medium">{{ props.title }}</p>
        <div class="text-viewer" v-html="sanitize(props.htmlData)"></div>
      </div>
    </div>
  </client-only>
</template>
<script setup>
import { sanitize } from "../../utils/sanitize";

const props = defineProps({
  title: {
    type: String,
    required: false,
  },
  htmlData: {
    type: String,
    required: true,
  },
  className: {
    type: String,
    required: false,
  },
});
</script>
