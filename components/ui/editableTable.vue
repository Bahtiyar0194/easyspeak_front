<template>
  <div v-if="tableData.table && tableData.table.length > 0" class="col-span-12">
    <div class="custom-grid">
      <div class="col-span-12">
        <div
          class="table table-responsive"
          :class="{
            'editable': tableData.editable,
            'table-sm': tableData.small,
            'table-striped': tableData.isStriped,
            'bordered': tableData.isBordered,
            'text-center': tableData.textCentered
          }"
        >
          <table>
            <tbody>
              <tr v-for="(row, rowIndex) in tableData.table" :key="rowIndex">
                <template v-for="(cell, colIndex) in row" :key="colIndex">
                  <td
                    v-if="cell"
                    :rowspan="cell.rowspan"
                    :colspan="cell.colspan"
                    :class="{
                      '!bg-blue-500 !text-white': selectedCells.includes(
                        `${rowIndex}-${colIndex}`
                      ),
                      th: cell.isHeader,
                    }"
                    @click="toggleCellSelection(rowIndex, colIndex)"
                    @dblclick="editCell(rowIndex, colIndex)"
                  >
                    <input
                      v-if="cell.editing"
                      v-model="cell.text"
                      @blur="cell.editing = false"
                      class="w-full"
                    />
                    <span v-else>{{ cell.text }}</span>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="col-span-12">
        <div class="btn-wrap">
          <button
            type="button"
            @click="mergeCells"
            class="btn btn-sm btn-light"
            :class="selectedCells.length < 2 && 'disabled'"
          >
            <i class="pi pi-link"></i>
            {{ $t("merge") }}
          </button>
          <button
            type="button"
            @click="splitCells"
            class="btn btn-sm btn-light"
            :class="!selectedCells.length && 'disabled'"
          >
            <i class="pi pi-th-large"></i>
            {{ $t("split") }}
          </button>
          <button
            type="button"
            @click="deleteSelectedRows"
            class="btn btn-sm btn-light"
            :class="!selectedCells.length && 'disabled'"
          >
            <i class="pi pi-times"></i>
            {{ $t("table.delete_rows") }}
          </button>
          <button
            type="button"
            @click="deleteSelectedColumns"
            class="btn btn-sm btn-light"
            :class="!selectedCells.length && 'disabled'"
          >
            <i class="pi pi-times"></i>
            {{ $t("table.delete_columns") }}
          </button>

          <button
            type="button"
            @click="deleteTable"
            class="btn btn-sm btn-outline-danger"
          >
            <i class="pi pi-times"></i>
            {{ $t("table.delete_table") }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="col-span-12 mt-2">
    <div class="custom-grid">
      <div class="col-span-12">
        <div class="form-group-border active">
          <i class="pi pi-equals"></i>
          <input
            type="number"
            v-model.number="rows"
            min="1"
            max="50"
            placeholder=" "
          />
          <label>{{ $t("table.rows_count") }}</label>
        </div>
      </div>

      <div class="col-span-12">
        <div class="form-group-border active">
          <i class="pi pi-pause"></i>
          <input
            type="number"
            v-model.number="columns"
            min="1"
            max="50"
            placeholder=" "
          />
          <label>{{ $t("table.columns_count") }}</label>
        </div>
      </div>

      <div class="flex flex-col gap-y-2">
        <label class="custom-radio-checkbox text-nowrap">
          <input type="checkbox" v-model="hasHeader" />
          <span>{{ $t("table.has_header") }}</span>
        </label>

        <label class="custom-radio-checkbox text-nowrap">
          <input type="checkbox" v-model="tableSmall" />
          <span>{{ $t("table.is_small") }}</span>
        </label>

        <label class="custom-radio-checkbox text-nowrap">
          <input type="checkbox" v-model="tableStriped" />
          <span>{{ $t("table.is_striped") }}</span>
        </label>

        <label class="custom-radio-checkbox text-nowrap">
          <input type="checkbox" v-model="tableBordered" />
          <span>{{ $t("table.is_bordered") }}</span>
        </label>

        <label class="custom-radio-checkbox text-nowrap">
          <input type="checkbox" v-model="textCentered" />
          <span>{{ $t("text_center") }}</span>
        </label>
      </div>

      <div class="col-span-12">
        <button
          type="button"
          @click="generateTable"
          class="btn btn-sm btn-light"
        >
          <i class="pi pi-table"></i>
          {{ $t("table.create") }}
        </button>
      </div>
    </div>
  </div>
  <input
    :name="props.tableName"
    type="hidden"
    :value="JSON.stringify(tableData)"
  />
  <div class="col-span-12" v-if="errors[props.tableName] && !tableData.table">
    <p class="text-danger text-sm mb-0">{{ $t('table.error_4') }}</p>
  </div>
</template>

<script setup>
const { t } = useI18n();
const rows = ref(3);
const columns = ref(3);
const hasHeader = ref(true);
const tableSmall = ref(false);
const tableStriped = ref(false);
const tableBordered = ref(true);
const textCentered = ref(false);
const tableData = ref({});
const selectedCells = ref([]);

const props = defineProps({
  tableName: {
    type: String,
    required: true,
  },
  errors: {
    type: Object,
    required: true,
  },
});

const generateTable = () => {
  if (rows.value < 1 || columns.value < 1) {
    alert(t("table.error_1"));
    return;
  }

  tableData.value = {
    editable: true,
    small: tableSmall.value,
    isBordered: tableBordered.value,
    isStriped: tableStriped.value,
    textCentered: textCentered.value,
    table: Array.from({ length: rows.value }, (_, rowIndex) =>
      Array.from({ length: columns.value }, (_, colIndex) => ({
        text:
          rowIndex === 0 && hasHeader.value
            ? t("title") + " " + (colIndex + 1)
            : `${rowIndex + 1}:${colIndex + 1}`,
        isHeader: rowIndex === 0 && hasHeader.value,
        editing: false,
        rowspan: 1,
        colspan: 1,
      }))
    ),
  };

  selectedCells.value = [];
};

const toggleCellSelection = (row, col) => {
  const cellKey = `${row}-${col}`;
  if (selectedCells.value.includes(cellKey)) {
    selectedCells.value = selectedCells.value.filter((key) => key !== cellKey);
  } else {
    selectedCells.value.push(cellKey);
  }
};

const editCell = (row, col) => {
  tableData.value.table[row][col].editing = true;
};

const mergeCells = () => {
  if (selectedCells.value.length < 2) return;

  const sortedCells = selectedCells.value
    .map((cell) => cell.split("-").map(Number))
    .sort(([r1, c1], [r2, c2]) => r1 - r2 || c1 - c2);

  const [startRow, startCol] = sortedCells[0];
  const [endRow, endCol] = sortedCells[sortedCells.length - 1];

  const rowspan = endRow - startRow + 1;
  const colspan = endCol - startCol + 1;

  tableData.value.table[startRow][startCol].rowspan = rowspan;
  tableData.value.table[startRow][startCol].colspan = colspan;

  sortedCells.slice(1).forEach(([r, c]) => {
    tableData.value.table[r][c] = null;
  });

  selectedCells.value = [];
};

const splitCells = () => {
  selectedCells.value.forEach((cellKey) => {
    const [row, col] = cellKey.split("-").map(Number);
    const cell = tableData.value.table[row][col];

    if (cell.rowspan > 1 || cell.colspan > 1) {
      for (let r = row; r < row + cell.rowspan; r++) {
        for (let c = col; c < col + cell.colspan; c++) {
          tableData.value.table[r][c] = {
            text: `${r + 1}:${c + 1}`,
            editing: false,
            rowspan: 1,
            colspan: 1,
          };
        }
      }
    }

    cell.rowspan = 1;
    cell.colspan = 1;
  });

  selectedCells.value = [];
};

const deleteSelectedRows = () => {
  if (tableData.value.table.length <= 1) {
    alert(t("table.error_2"));
    return;
  }

  const rowsToDelete = Array.from(
    new Set(selectedCells.value.map((cell) => Number(cell.split("-")[0])))
  ).sort((a, b) => b - a);

  rowsToDelete.forEach((row) => tableData.value.table.splice(row, 1));
  selectedCells.value = [];
};

const deleteSelectedColumns = () => {
  if (tableData.value.table[0].length <= 1) {
    alert(t("table.error_3"));
    return;
  }

  const colsToDelete = Array.from(
    new Set(selectedCells.value.map((cell) => Number(cell.split("-")[1])))
  ).sort((a, b) => b - a);

  tableData.value.table.forEach((row) => {
    colsToDelete.forEach((col) => row.splice(col, 1));
  });

  selectedCells.value = [];
};

const deleteTable = () => {
  if (confirm(t("table.confirm_1"))) {
    tableData.value = {};
  }
};

const { errors } = toRefs(props);
</script>
