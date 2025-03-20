<template>
  <div v-if="props.tableData.table && tableData.table.length > 0" class="col-span-12">
    <div class="custom-grid">
      <div class="col-span-12">
        <div
          class="table table-responsive"
          :class="{
            'table-sm': tableData.isSmall,
            'table-striped': tableData.isStriped,
            bordered: tableData.isBordered,
            'text-center': tableData.textCentered,
          }"
        >
          <table>
            <tbody>
              <tr v-for="(row, rowIndex) in props.tableData.table" :key="rowIndex">
                <template v-for="(cell, colIndex) in row" :key="colIndex">
                  <td
                  v-if="cell && !cell.merged"
                    :rowspan="cell.rowspan"
                    :colspan="cell.colspan"
                    :class="{
                      [cell.textColorClass]: true, // Динамический ключ
                      th: rowIndex === 0 && tableData.hasHeader === true,
                      'font-medium': cell.isBold,
                      italic: cell.isItalic,
                      underline: cell.isUnderLine,
                      'line-through': cell.isStrike,
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
