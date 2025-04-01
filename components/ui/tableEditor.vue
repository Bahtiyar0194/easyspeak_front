<template>
  <div v-show="!tableData" class="col-span-12">
    <textarea
      id="editableDiv"
      class=" pt-6 border-inactive bg-inactive border-dashed rounded-xl text-center w-full"
      :placeholder="$t('table.copy_and_paste_the_table_here')"
    ></textarea>
  </div>
  <div v-show="tableData" class="col-span-12">
    <div class="custom-grid">
      <div class="col-span-12">
        <p class="mb-0 font-medium">{{ $t("table.table_options") }}:</p>
      </div>
      <div class="col-span-12">
        <div class="flex flex-wrap gap-x-4 gap-y-2">
          <label class="custom-radio-checkbox text-nowrap">
            <input type="checkbox" v-model="options.tableSmall" />
            <span>{{ $t("table.is_small") }}</span>
          </label>

          <label class="custom-radio-checkbox text-nowrap">
            <input type="checkbox" v-model="options.tableStriped" />
            <span>{{ $t("table.is_striped") }}</span>
          </label>

          <label class="custom-radio-checkbox text-nowrap">
            <input type="checkbox" v-model="options.tableBordered" />
            <span>{{ $t("table.is_bordered") }}</span>
          </label>

          <label class="custom-radio-checkbox text-nowrap">
            <input type="checkbox" v-model="options.textCentered" />
            <span>{{ $t("text_center") }}</span>
          </label>
        </div>
      </div>
      <div class="col-span-12">
        <div
          class="table table-responsive"
          :class="{
            'table-sm': options.tableSmall,
            'table-striped': options.tableStriped,
            bordered: options.tableBordered,
            'text-center': options.textCentered,
          }"
          v-html="tableData"
        ></div>

        <input :name="props.tableName" type="hidden" :value="tableData" />
        <input
          :name="props.tableName + '_options'"
          type="hidden"
          :value="JSON.stringify(options)"
        />
      </div>
      <div class="col-span-12">
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
  <div class="col-span-12" v-if="errors[props.tableName] && !tableData">
    <p class="text-danger text-sm mb-0">{{ $t("table.error_4") }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
const { t } = useI18n();
const tableData = ref(null); // Храним очищенную таблицу

const options = ref({
  tableSmall: true,
  tableStriped: true,
  tableBordered: true,
  textCentered: false,
});

const props = defineProps({
  tableName: {
    type: String,
    required: true,
  },
  material: {
    type: Object,
    required: false,
  },
  errors: {
    type: Object,
    required: true,
  },
});

const cleanCellContent = (cell) => {
  let content = cell.innerHTML;

  // Очищаем ненужные inline-стили, оставляя только нужные
  content = content.replace(/style="([^"]+)"/gi, (match, styles) => {
    const allowedStyles = [];
    styles.split(";").forEach((style) => {
      const [prop, value] = style.split(":").map((s) => s.trim());
      if (
        ["color", "text-decoration", "font-weight", "font-style"].includes(prop)
      ) {
        allowedStyles.push(`${prop}: ${value}`);
      }
    });
    return allowedStyles.length ? `style="${allowedStyles.join("; ")}"` : "";
  });

  // Оставляем только нужные теги (b, strong, i, em, u, span)
  content = content.replace(
    /<(?!\/?(b|strong|i|em|u|s|span)(?=>|\s.*>))[^>]+>/gi,
    ""
  );

  return content;
};

const handlePaste = (e) => {
  e.preventDefault();
  const clipboardData = e.clipboardData || window.clipboardData;
  const html = clipboardData.getData("text/html");

  if (!html.includes("<table")) return;

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const table = tempDiv.querySelector("table");
  if (!table) return;

  let newTableHTML = "<table>";

  table.querySelectorAll("tr").forEach((row) => {
    newTableHTML += "<tr>";
    row.querySelectorAll("td, th").forEach((cell) => {
      const tag = cell.tagName.toLowerCase();
      newTableHTML += `<${tag}>${cleanCellContent(cell)}</${tag}>`;
    });
    newTableHTML += "</tr>";
  });

  newTableHTML += "</table>";
  tableData.value = newTableHTML; // Обновляем таблицу
};

const deleteTable = () => {
  if (confirm(t("table.confirm_1"))) {
    tableData.value = null;
  }
};

// Добавляем обработчик вставки при монтировании
onMounted(() => {
  const editableDiv = document.getElementById("editableDiv");
  if (editableDiv) {
    editableDiv.addEventListener("paste", handlePaste);
  }

  if (props.material) {
    tableData.value = props.material.content;
    options.value = JSON.parse(props.material.options);
  }
});
</script>
