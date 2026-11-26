<template>
  <div class="pagination-bar">
    <!-- Сколько показано -->
    <p class="pagination-info">
      {{
        $t("pagination.shown", {
          shown: props.items.data.length,
          total: props.items.total,
        })
      }}
    </p>

    <!-- Страницы -->
    <nav
      v-if="props.items && props.items.last_page > 1"
      class="pagination"
      :aria-label="$t('pagination.pages')"
    >
      <button
        :disabled="props.items.current_page <= 1"
        @click="setItems(props.items.first_page_url)"
        class="page-btn max-sm:hidden"
        type="button"
        :title="$t('pagination.first_page_title')"
        :aria-label="$t('pagination.first_page_title')"
      >
        <i class="pi pi-angle-double-left" aria-hidden="true"></i>
      </button>

      <template v-for="(link, index) in props.items.links" :key="index">
        <!-- «…» между номерами страниц -->
        <span
          v-if="!link.url && link.label === '...'"
          class="page-gap"
          aria-hidden="true"
          >…</span
        >
        <button
          v-else-if="link.url || isArrow(link.label)"
          :disabled="!link.url"
          @click="link.url && setItems(link.url)"
          class="page-btn"
          :class="{ active: link.active }"
          :aria-current="link.active ? 'page' : undefined"
          type="button"
          :title="getButtonTitle(link.label)"
          :aria-label="getButtonTitle(link.label)"
        >
          <i
            v-if="link.label === 'pagination.previous'"
            class="pi pi-angle-left"
            aria-hidden="true"
          ></i>
          <i
            v-else-if="link.label === 'pagination.next'"
            class="pi pi-angle-right"
            aria-hidden="true"
          ></i>
          <template v-else>{{ link.label }}</template>
        </button>
      </template>

      <button
        :disabled="props.items.last_page <= props.items.current_page"
        @click="setItems(props.items.last_page_url)"
        class="page-btn max-sm:hidden"
        type="button"
        :title="$t('pagination.last_page_title')"
        :aria-label="$t('pagination.last_page_title')"
      >
        <i class="pi pi-angle-double-right" aria-hidden="true"></i>
      </button>
    </nav>

    <!-- Сколько на странице -->
    <label class="per-page" :class="bgClassName">
      <span class="text-sm text-inactive whitespace-nowrap">{{
        $t("pagination.limit_per_page")
      }}</span>
      <span class="per-page-select-wrap">
        <select v-model="perPage" @change="handlePerPageChange($event)">
          <option
            v-for="(value, index) in perPageValues"
            :key="index"
            :value="value"
          >
            {{
              index + 1 === perPageValues.length
                ? $t("pagination.unlimit")
                : value.toLocaleString("ru-RU")
            }}
          </option>
        </select>
        <i class="pi pi-angle-down" aria-hidden="true"></i>
      </span>
    </label>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const perPageValues = [5, 10, 100, 1000, 10000, 100000, 1000000];

const props = defineProps({
  items: {
    type: Object,
    required: true,
  },
  setItems: {
    type: Function,
    required: true,
  },
  onSelect: {
    type: Function,
    required: true,
  },
  bgClassName: {
    type: String,
    required: false,
  },
  defaultPerPage: {
    type: Number,
    required: false,
  },
});

const { t } = useI18n();
const perPage = ref(props.defaultPerPage || 10);

const handlePerPageChange = (event) => {
  const selectedValue = event.target.value;

  if (props.onSelect) {
    props.onSelect(selectedValue);
  }
  setTimeout(() => {
    props.setItems();
  }, 500);
};

const isArrow = (label) =>
  label === "pagination.previous" || label === "pagination.next";

const getButtonTitle = (label) => {
  if (label === "pagination.previous") {
    return t("pagination.previous_page_title");
  } else if (label === "pagination.next") {
    return t("pagination.next_page_title");
  }
  return label;
};
</script>
