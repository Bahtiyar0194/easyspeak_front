<template>
  <div v-if="props.tableData.table && tableData.table.length > 0" class="col-span-12">
    <div class="custom-grid">
      <div class="col-span-12">
        <div
          class="table table-responsive"
          :class="{
            'table-sm': props.tableData.small,
            'table-striped': props.tableData.isStriped,
            bordered: props.tableData.isBordered,
            'text-center': props.tableData.textCentered,
          }"
        >
          <table>
            <tbody>
              <tr v-for="(row, rowIndex) in props.tableData.table" :key="rowIndex">
                <template v-for="(cell, colIndex) in row" :key="colIndex">
                  <td
                    v-if="cell"
                    :rowspan="cell.rowspan"
                    :colspan="cell.colspan"
                    :class="{
                      th: cell.isHeader,
                    }"
                  >
                    <span>{{ cell.text }}</span>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  tableData: {
    type: Object,
    required: true,
  },
});
</script>
