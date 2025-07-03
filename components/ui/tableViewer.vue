<template>
  <div v-if="props.tableData" class="col-span-12">
    <div class="custom-grid">
      <div class="col-span-12">
        <div
          class="table"
          :class="{
            'table-sm': props.options.tableSmall,
            'table-striped': props.options.tableStriped,
            bordered: props.options.tableBordered,
            'text-center': props.options.textCentered,
          }"
          v-html="sanitize(props.tableData)"
        ></div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { sanitize } from "../../utils/sanitize";

const props = defineProps({
  tableData: {
    type: String,
    required: true,
  },
  options: {
    type: Object,
    required: true,
  },
});
</script>
