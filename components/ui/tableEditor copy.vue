<template>
  <div v-if="!tableData.table" class="col-span-12">
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
  <div v-else class="col-span-12">
    <div class="custom-grid">
      <div class="col-span-12">
        <div class="flex flex-wrap gap-x-4 gap-y-2">
          <label class="custom-radio-checkbox text-nowrap">
            <input
              type="checkbox"
              v-model="hasHeader"
              @change="tableData.hasHeader = hasHeader"
            />
            <span>{{ $t("table.has_header") }}</span>
          </label>

          <label class="custom-radio-checkbox text-nowrap">
            <input
              type="checkbox"
              v-model="tableSmall"
              @change="tableData.isSmall = tableSmall"
            />
            <span>{{ $t("table.is_small") }}</span>
          </label>

          <label class="custom-radio-checkbox text-nowrap">
            <input
              type="checkbox"
              v-model="tableStriped"
              @change="tableData.isStriped = tableStriped"
            />
            <span>{{ $t("table.is_striped") }}</span>
          </label>

          <label class="custom-radio-checkbox text-nowrap">
            <input
              type="checkbox"
              v-model="tableBordered"
              @change="tableData.isBordered = tableBordered"
            />
            <span>{{ $t("table.is_bordered") }}</span>
          </label>

          <label class="custom-radio-checkbox text-nowrap">
            <input
              type="checkbox"
              v-model="textCentered"
              @change="tableData.textCentered = textCentered"
            />
            <span>{{ $t("text_center") }}</span>
          </label>
        </div>
      </div>
      <div class="col-span-12">
        <div class="flex flex-wrap gap-x-1 gap-y-3 mt-2 items-center">
          <button
            type="button"
            @click="toggleBold"
            class="btn btn-square btn-sm"
            :class="isBoldActive ? 'btn-primary' : 'btn-light'"
            :title="$t('text.bold')"
          >
            <i class="bi bi-type-bold"></i>
          </button>
          <button
            type="button"
            @click="toggleItalic"
            class="btn btn-square btn-sm"
            :class="isItalicActive ? 'btn-primary' : 'btn-light'"
            :title="$t('text.italic')"
          >
            <i class="bi bi-type-italic"></i>
          </button>
          <button
            type="button"
            @click="toggleUnderline"
            class="btn btn-square btn-sm"
            :class="isUnderlineActive ? 'btn-primary' : 'btn-light'"
            :title="$t('text.underline')"
          >
            <i class="bi bi-type-underline"></i>
          </button>
          <button
            type="button"
            @click="toggleStrike"
            class="btn btn-square btn-sm"
            :class="isStrikeActive ? 'btn-primary' : 'btn-light'"
            :title="$t('text.strikethrough')"
          >
            <i class="bi bi-type-strikethrough"></i>
          </button>

          <dropdownMenu
            :dropdownArrow="false"
            :position="'left'"
            :noAbsolute="false"
          >
            <template v-slot:btn_content>
              <button type="button" class="btn btn-sm btn-light">
                <i class="pi pi-align-left" :class="currentTextColorClass"></i>
                <span>{{ $t("board.params.text_color") }}</span>
              </button>
            </template>

            <template v-slot:menu_content>
              <div class="grid grid-cols-4 gap-1.5 py-2">
                <button
                  v-for="(color, colorIndex) in textColors"
                  :key="colorIndex"
                  type="button"
                  @click="changeTextColor(color)"
                >
                  <i class="pi pi-circle-fill text-lg" :class="color"></i>
                </button>
              </div>
            </template>
          </dropdownMenu>

          <dropdownMenu
            :dropdownArrow="false"
            :position="'left'"
            :noAbsolute="false"
          >
            <template v-slot:btn_content>
              <button type="button" class="btn btn-sm btn-light" :class="tableData.isStriped && 'disabled'">
                <div
                  class="rounded-full h-5 w-5 border-inactive"
                  :class="currentCellColorClass"
                ></div>
                <span>{{ $t("board.params.cell_color") }}</span>
              </button>
            </template>

            <template v-slot:menu_content>
              <div class="grid grid-cols-4 gap-1.5 py-2">
                <button
                  v-for="(color, colorIndex) in cellColors"
                  :key="colorIndex"
                  type="button"
                  @click="changeCellColor(color)"
                >
                  <div class="rounded-full h-5 w-5 border-inactive" :class="color"></div>
                </button>
              </div>
            </template>
          </dropdownMenu>
        </div>
      </div>
      <div class="col-span-12">
        <div
          class="table table-responsive"
          :class="{
            editable: tableData.editable,
            'table-sm': tableData.isSmall,
            'table-striped': tableData.isStriped,
            bordered: tableData.isBordered,
            'text-center': tableData.textCentered,
          }"
        >
          <table>
            <tbody>
              <tr v-for="(row, rowIndex) in tableData.table" :key="rowIndex">
                <template v-for="(cell, cellIndex) in row" :key="cellIndex">
                  <td
                    v-if="cell && !cell.merged"
                    :rowspan="cell.rowspan"
                    :colspan="cell.colspan"
                    :class="{
                      [cell.textColorClass]: true, // Динамический ключ цвета текста
                      [cell.cellColorClass]: !tableData.isStriped, // Динамический ключ цвета ячейки
                      selected: cell.selected === true,
                      th: rowIndex === 0 && tableData.hasHeader === true,
                      'font-medium': cell.isBold,
                      italic: cell.isItalic,
                      underline: cell.isUnderLine,
                      'line-through': cell.isStrike,
                    }"
                    :contenteditable="tableData.editable"
                    @input="updateCell($event, rowIndex, cellIndex)"
                    @mousedown="onMouseDown"
                    @mouseover="onMouseOver(rowIndex, cellIndex)"
                  >
                    <span>{{ cell.text }}</span>
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
            :class="!selectedCells.length && 'disabled'"
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
          <button type="button" @click="addRow" class="btn btn-sm btn-light">
            <i class="pi pi-equals"></i>
            {{ $t("table.add_row") }}
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
          <button type="button" @click="addColumn" class="btn btn-sm btn-light">
            <i class="pi pi-pause"></i>
            {{ $t("table.add_column") }}
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
  <input
    :name="props.tableName"
    type="hidden"
    :value="JSON.stringify(tableData)"
  />
  <div class="col-span-12" v-if="errors[props.tableName] && !tableData.table">
    <p class="text-danger text-sm mb-0">{{ $t("table.error_4") }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import dropdownMenu from "./dropdownMenu.vue";

const { t } = useI18n();
const rows = ref(5);
const columns = ref(5);
const hasHeader = ref(true);
const tableSmall = ref(false);
const tableStriped = ref(false);
const tableBordered = ref(true);
const textCentered = ref(false);
const tableData = ref([]);
const isMouseDown = ref(false);
const startRowIndex = ref(null);
const startCellIndex = ref(null);
const hasMoved = ref(false);
const selectedCells = ref([]);

const isBoldActive = ref(false);
const isItalicActive = ref(false);
const isUnderlineActive = ref(false);
const isStrikeActive = ref(false);
const currentTextColorClass = ref("text-active");
const currentCellColorClass = ref("bg-active");

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

const textColors = [
  "text-active",
  "text-inactive",
  "text-red-500",
  "text-green-500",
  "text-blue-500",
  "text-yellow-500",
  "text-orange-500",
  "text-cyan-500",
  "text-violet-500",
  "text-rose-500",
];

const cellColors = [
  "bg-active",
  "bg-inactive",
  "bg-red-500",
  "bg-green-500",
  "bg-blue-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-cyan-500",
  "bg-violet-500",
  "bg-rose-500",
];

const changeTextColor = (color) => {
  currentTextColorClass.value = color;

  tableData.value.table.forEach((tr) => {
    tr.forEach((td) => {
      if (td.selected === true) {
        td.textColorClass = color;
        td.selected = false;
      }
    });
  });
};

const changeCellColor = (color) => {
  currentCellColorClass.value = color;

  tableData.value.table.forEach((tr) => {
    tr.forEach((td) => {
      if (td.selected === true) {
        td.cellColorClass = color;
        td.selected = false;
      }
    });
  });
};

const toggleBold = () => {
  isBoldActive.value = !isBoldActive.value;

  tableData.value.table.forEach((tr) => {
    tr.forEach((td) => {
      if (td.selected === true) {
        td.isBold = isBoldActive.value;
        td.selected = false;
      }
    });
  });
};

const toggleItalic = () => {
  isItalicActive.value = !isItalicActive.value;

  tableData.value.table.forEach((tr) => {
    tr.forEach((td) => {
      if (td.selected === true) {
        td.isItalic = isItalicActive.value;
        td.selected = false;
      }
    });
  });
};

const toggleUnderline = () => {
  isUnderlineActive.value = !isUnderlineActive.value;
  isUnderlineActive.value === true && (isStrikeActive.value = false);

  tableData.value.table.forEach((tr) => {
    tr.forEach((td) => {
      if (td.selected === true) {
        td.isUnderLine = isUnderlineActive.value;
        td.selected = false;
      }
    });
  });
};

const toggleStrike = () => {
  isStrikeActive.value = !isStrikeActive.value;
  isStrikeActive.value === true && (isUnderlineActive.value = false);

  tableData.value.table.forEach((tr) => {
    tr.forEach((td) => {
      if (td.selected === true) {
        td.isStrike = isStrikeActive.value;
        td.selected = false;
      }
    });
  });
};

const updateCell = (event, rowIndex, cellIndex) => {
  tableData.value.table[rowIndex][cellIndex].textColorClass =
    currentTextColorClass.value;
  tableData.value.table[rowIndex][cellIndex].isBold = isBoldActive.value;
  tableData.value.table[rowIndex][cellIndex].isItalic = isItalicActive.value;
  tableData.value.table[rowIndex][cellIndex].isUnderLine =
    isUnderlineActive.value;
  tableData.value.table[rowIndex][cellIndex].isStrike = isStrikeActive.value;
  tableData.value.table[rowIndex][cellIndex].text = event.target.innerText;
};

// Генерация таблицы
const generateTable = () => {
  if (rows.value < 2 || columns.value < 2) {
    alert(t("table.error_1"));
    return;
  }

  tableData.value = {
    editable: true,
    hasHeader: hasHeader.value,
    isSmall: tableSmall.value,
    isBordered: tableBordered.value,
    isStriped: tableStriped.value,
    textCentered: textCentered.value,
    table: Array.from({ length: rows.value }, (_, rowIndex) =>
      Array.from({ length: columns.value }, (_, colIndex) => ({
        text: "",
        cellColorClass: currentCellColorClass.value,
        textColorClass: currentTextColorClass.value,
        isBold: isBoldActive.value,
        isItalic: isItalicActive.value,
        isUnderLine: isUnderlineActive.value,
        isStrike: isStrikeActive.value,
        selected: false,
        rowspan: 1,
        colspan: 1,
        merged: false,
      }))
    ),
  };

  selectedCells.value = [];
};

// Функция выделения ячеек
const selectTo = (rowIndex, cellIndex) => {
  if (startRowIndex.value === null || startCellIndex.value === null) return;

  let rowStart = Math.min(startRowIndex.value, rowIndex);
  let rowEnd = Math.max(startRowIndex.value, rowIndex);
  let cellStart = Math.min(startCellIndex.value, cellIndex);
  let cellEnd = Math.max(startCellIndex.value, cellIndex);

  tableData.value.table.forEach((tr, i) => {
    if (i >= rowStart && i <= rowEnd) {
      tr.forEach((td, j) => {
        if (j >= cellStart && j <= cellEnd) {
          td.selected = true;
        }
      });
    }
  });

  const cellKey = { rowIndex, cellIndex };
  if (selectedCells.value.includes(cellKey)) {
    selectedCells.value = selectedCells.value.filter((key) => key !== cellKey);
  } else {
    selectedCells.value.push(cellKey);
  }
};

// Функция начала выделения
const onMouseDown = (event) => {
  const cell = event.target;
  if (!cell || cell.tagName !== "TD") return;

  isMouseDown.value = true;
  hasMoved.value = false;

  tableData.value.table.forEach((tr) => {
    tr.forEach((td) => {
      td.selected = false;
    });
  });

  selectedCells.value = [];

  startRowIndex.value = [...cell.parentElement.parentElement.children].indexOf(
    cell.parentElement
  );
  startCellIndex.value = [...cell.parentElement.children].indexOf(cell);
};

// Функция изменения выделения при наведении
const onMouseOver = (rowIndex, cellIndex) => {
  if (!isMouseDown.value) return;

  if (!hasMoved.value) {
    hasMoved.value = true;
  }

  selectTo(rowIndex, cellIndex);
};

const onMouseUp = () => {
  isMouseDown.value = false;
};

// Объединение выделенных ячеек
const mergeCells = () => {
  const selected = [];
  tableData.value.table.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell.selected) {
        selected.push({ rowIndex, colIndex });
      }
    });
  });

  if (selected.length < 2) return; // Не объединяем, если выбрана одна ячейка

  // Определяем границы выделенной области
  const minRow = Math.min(...selected.map((cell) => cell.rowIndex));
  const maxRow = Math.max(...selected.map((cell) => cell.rowIndex));
  const minCol = Math.min(...selected.map((cell) => cell.colIndex));
  const maxCol = Math.max(...selected.map((cell) => cell.colIndex));

  const rowspan = maxRow - minRow + 1;
  const colspan = maxCol - minCol + 1;

  // Обновляем верхнюю левую ячейку
  const mainCell = tableData.value.table[minRow][minCol];
  mainCell.rowspan = rowspan;
  mainCell.colspan = colspan;
  mainCell.selected = false;

  // Скрываем остальные ячейки в выделенной области
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (row === minRow && col === minCol) continue; // Пропускаем главную ячейку
      tableData.value.table[row][col] = { merged: true }; // Помечаем как скрытую
    }
  }

  selectedCells.value = [];
};

// Разъединение ячеек
const splitCells = () => {
  tableData.value.table.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell.rowspan > 1 || cell.colspan > 1) {
        // Разбиваем объединенные ячейки
        for (let r = 0; r < cell.rowspan; r++) {
          for (let c = 0; c < cell.colspan; c++) {
            if (r === 0 && c === 0) {
              tableData.value.table[rowIndex][colIndex] = {
                text: cell.text,
                selected: false,
                rowspan: 1,
                colspan: 1,
              };
            } else {
              tableData.value.table[rowIndex + r][colIndex + c] = {
                text: "",
                selected: false,
                rowspan: 1,
                colspan: 1,
              };
            }
          }
        }
      }
    });
  });
  selectedCells.value = [];
};

// Удаление выделенных строк
const deleteSelectedRows = () => {
  tableData.value.table = tableData.value.table.filter(
    (row) => !row.some((cell) => cell.selected)
  );
  selectedCells.value = [];
};

// Удаление выделенных столбцов
const deleteSelectedColumns = () => {
  const selectedColumns = new Set();

  // Найти выделенные столбцы
  tableData.value.table.forEach((row) => {
    row.forEach((cell, colIndex) => {
      if (cell.selected) {
        selectedColumns.add(colIndex);
      }
    });
  });

  // Удалить выделенные столбцы из всех строк
  tableData.value.table = tableData.value.table.map((row) =>
    row.filter((_, colIndex) => !selectedColumns.has(colIndex))
  );

  selectedCells.value = [];
};

const addRow = () => {
  const columnsCount = tableData.value.table[0]?.length || 0;
  if (columnsCount === 0) return;

  // Найти первую выделенную строку
  const selectedRowIndex = tableData.value.table.findIndex((row) =>
    row.some((cell) => cell.selected)
  );

  const newRow = Array.from({ length: columnsCount }, () => ({
    text: "",
    selected: false,
    rowspan: 1,
    colspan: 1,
  }));

  // Вставляем строку после выделенной, иначе в конец
  if (selectedRowIndex !== -1) {
    tableData.value.table.splice(selectedRowIndex + 1, 0, newRow);
  } else {
    tableData.value.table.push(newRow);
  }
};

const addColumn = () => {
  const rowsCount = tableData.value.table.length;
  if (rowsCount === 0) return;

  // Найти первый выделенный столбец
  let selectedColumnIndex = -1;
  tableData.value.table.forEach((row) => {
    row.forEach((cell, colIndex) => {
      if (cell.selected && selectedColumnIndex === -1) {
        selectedColumnIndex = colIndex;
      }
    });
  });

  // Добавить новую ячейку в каждую строку
  tableData.value.table.forEach((row) => {
    const newCell = { text: "", selected: false, rowspan: 1, colspan: 1 };

    // Вставляем после выделенного столбца, иначе в конец
    if (selectedColumnIndex !== -1) {
      row.splice(selectedColumnIndex + 1, 0, newCell);
    } else {
      row.push(newCell);
    }
  });
};

const deleteTable = () => {
  if (confirm(t("table.confirm_1"))) {
    tableData.value = {};
  }
};

onMounted(() => {
  document.addEventListener("mouseup", onMouseUp);
});

onBeforeUnmount(() => {
  document.removeEventListener("mouseup", onMouseUp);
});
</script>
