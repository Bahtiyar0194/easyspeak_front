<template>
  <div
    :class="[props.className, { 'ms-open': selectMenuOpen }]"
    ref="selectWrapper"
    tabindex="0"
    role="combobox"
    :aria-expanded="selectMenuOpen"
    aria-haspopup="listbox"
    @keydown.enter.self.prevent="toggleSelect"
    @keydown.space.self.prevent="toggleSelect"
    @keydown.down.self.prevent="selectMenuOpen = true"
  >
    <i :class="props.icon"></i>
    <input
      class="!cursor-pointer"
      :value="summary"
      :title="summaryTitle || undefined"
      tabindex="-1"
      @click="toggleSelect"
      readonly
    />

    <button
      v-show="selected.length > 0"
      type="button"
      @click.stop="resetAllCheckboxes"
      class="clear mr-5 -mt-1"
      :title="$t('reset_search_filter')"
      :aria-label="$t('reset_search_filter')"
    >
      <i class="pi pi-times text-xs text-danger" aria-hidden="true"></i>
    </button>

    <div
      v-if="props.items && props.items.length > 0"
      class="multiple-select-menu-wrap"
      :class="{ show: selectMenuOpen === true }"
      ref="selectMenu"
    >
      <div class="form-group-border mt-3 active label-active w-full">
        <i class="pi pi-search"></i>
        <input
          ref="searchInput"
          v-model="searchTerm"
          type="text"
          placeholder=" "
          autocomplete="off"
        />
        <label>
          {{ $t("search") }}
        </label>
        <button
          v-show="searchTerm != ''"
          type="button"
          @click="searchTerm = ''"
          class="clear -mt-1"
          :aria-label="$t('reset_search_filter')"
        >
          <i class="pi pi-times text-xs text-danger" aria-hidden="true"></i>
        </button>
      </div>

      <p class="text-inactive text-sm mt-2 mb-0" v-if="visibleCount === 0">
        {{ $t("nothing_was_found_for_your_query") }}
      </p>

      <!-- Все пункты остаются в DOM (v-show), иначе поиск «терял» выбранные
           значения: скрытые галочки не попадали в FormData фильтра. -->
      <ul class="multiple-select-menu" role="listbox" aria-multiselectable="true">
        <li
          v-for="(item, index) in props.items"
          :key="item[props.optionValue] ?? index"
          v-show="matches(item)"
        >
          <label
            class="custom-radio-checkbox w-full whitespace-nowrap"
            :class="props.avatar && 'avatar'"
          >
            <input
              type="checkbox"
              :name="props.optionName"
              :value="item[props.optionValue]"
              v-model="selected"
              @change="props.onChange()"
            />
            <span v-if="!props.avatar">{{ item[props.optionLabel] }}</span>
            <span v-else>
              <div class="flex gap-x-1.5 items-center">
                <userAvatar
                  :padding="0.5"
                  :className="'w-5 h-5 text-[9px]'"
                  :user="item"
                  :isChecked="isCheckboxChecked(item[props.optionValue])"
                />
                {{ item[props.optionLabel] }}
              </div>
            </span>
          </label>
        </li>
      </ul>
    </div>
    <label>{{ props.label }}</label>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import userAvatar from "./userAvatar.vue";

const { t } = useI18n();

const selectWrapper = ref(null);
const selectMenu = ref(null);
const searchInput = ref(null);
const selectMenuOpen = ref(false);
const searchTerm = ref("");
// Выбранные значения — единственный источник правды
const selected = ref([]);

const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  className: {
    type: String,
    required: false,
  },
  items: {
    type: Array,
    required: true,
    default: () => [],
  },
  optionName: {
    type: String,
    required: true,
  },
  optionValue: {
    type: String,
    required: true,
  },
  optionLabel: {
    type: String,
    required: true,
  },
  avatar: {
    type: Boolean,
    required: false,
  },
  onChange: {
    type: Function,
    required: true,
  },
});

const matches = (item) => {
  const q = searchTerm.value.trim().toLowerCase();
  if (!q) return true;
  return String(item[props.optionLabel] ?? "")
    .toLowerCase()
    .includes(q);
};

const visibleCount = computed(
  () => (props.items || []).filter((item) => matches(item)).length,
);

const isCheckboxChecked = (value) => selected.value.includes(value);

// В поле — названия выбранных (до двух) и «+N», а не просто «Выбрано: 3»
const selectedLabels = computed(() =>
  (props.items || [])
    .filter((item) => selected.value.includes(item[props.optionValue]))
    .map((item) => String(item[props.optionLabel] ?? "")),
);

const summary = computed(() => {
  const labels = selectedLabels.value;
  if (!labels.length) return t("not_selected");
  if (labels.length <= 2) return labels.join(", ");
  return `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`;
});

const summaryTitle = computed(() => selectedLabels.value.join(", "));

const resetAllCheckboxes = () => {
  if (!selected.value.length) return;
  selected.value = [];
  // Дождёмся снятия галочек в DOM, чтобы FormData фильтра была уже пустой
  nextTick(() => props.onChange());
};

// Клик вне компонента закрывает список
const handleClickOutside = (event) => {
  if (selectWrapper.value && !selectWrapper.value.contains(event.target)) {
    selectMenuOpen.value = false;
  }
};

// Сброс формы (кнопка «Сбросить фильтр»)
const handleFormReset = () => {
  selected.value = [];
  searchTerm.value = "";
};

const handleKeyPress = (event) => {
  if (event.key === "Escape" && selectMenuOpen.value) {
    selectMenuOpen.value = false;
    selectWrapper.value?.focus();
  }
};

let formElement = null;

onMounted(() => {
  window.addEventListener("click", handleClickOutside);
  window.addEventListener("keydown", handleKeyPress);

  formElement = selectWrapper.value?.closest("form") || null;
  formElement?.addEventListener("reset", handleFormReset);
});

onBeforeUnmount(() => {
  window.removeEventListener("click", handleClickOutside);
  window.removeEventListener("keydown", handleKeyPress);
  formElement?.removeEventListener("reset", handleFormReset);
});

const toggleSelect = () => {
  selectMenuOpen.value = !selectMenuOpen.value;
};

// При открытии — фокус в поиск, чтобы сразу печатать
watch(selectMenuOpen, (open) => {
  if (open) nextTick(() => searchInput.value?.focus({ preventScroll: true }));
});

// Если список вариантов сменился (например, другой курс) — убираем
// выбранные значения, которых в нём больше нет
watch(
  () => props.items,
  (items) => {
    const values = new Set((items || []).map((i) => i[props.optionValue]));
    selected.value = selected.value.filter((v) => values.has(v));
  },
);
</script>
