<template>
  <div class="col-span-12">
    <div
      v-if="props.tableData"
      ref="tableContainer"
      class="table"
      id="material_table"
      :class="{
        'table-sm': props.options.tableSmall,
        'table-striped': props.options.tableStriped,
        bordered: props.options.tableBordered,
        'text-center': props.options.textCentered,
      }"
      v-html="sanitize(props.tableData)"
    ></div>
  </div>
</template>
<script setup>
import { sanitize } from "../../utils/sanitize";
const tableContainer = ref(null);
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

onMounted(async () => {
  await nextTick();
  const table = tableContainer.value.querySelector("table");
  if (!table) return;

  Array.from(table.rows).forEach((row, rowIndex) => {
    Array.from(row.cells).forEach((cell, colIndex) => {
      cell.dataset.row = rowIndex;
      cell.dataset.col = colIndex;
      cell.dataset.cellId = `r${rowIndex}c${colIndex}`;
    });
  });

  //initSelectionHandlers(); // запустить обработчики
});
</script>
