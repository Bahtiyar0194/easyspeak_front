<template>
    <div class="w-full mb-2 text-inactive">
        {{ $t('pagination.shown', { shown: props.items.data.length, total: props.items.total }) }}
    </div>
    <div class="pagination-wrap">
        <div v-if="props.items && props.items.last_page > 1" class="pagination">
            <button v-if="props.items.current_page > 1" @click="setItems(props.items.first_page_url)"
                class="btn btn-square btn-sm btn-light" type="button" :title="$t('pagination.first_page_title')">
                &#171;
            </button>

            <button v-for="(link, index) in filteredLinks" :key="index" @click="setItems(link.url)"
                :class="['btn btn-square btn-sm', link.active ? 'btn-outline-primary disabled' : 'btn-light']"
                type="button"
                :title="getButtonTitle(link.label)">
                <template v-if="link.label === 'pagination.previous'">&#8249;</template>
                <template v-else-if="link.label === 'pagination.next'">&#8250;</template>
                <template v-else>{{ link.label }}</template>
            </button>

            <button v-if="props.items.last_page > props.items.current_page" @click="setItems(props.items.last_page_url)"
                class="btn btn-square btn-sm btn-light" type="button" :title="$t('pagination.last_page_title')">
                &#187;
            </button>
        </div>

        <div class="per-page-select active" :class="bgClassName">
            <select v-model="perPage" @change="handlePerPageChange($event)">
                <option v-for="(value, index) in perPageValues" :key="index" :value="value">{{ (index + 1) ===
                    perPageValues.length ? $t('pagination.unlimit') : value.toLocaleString('ru-RU') }}</option>
            </select>
            <label>{{ $t('pagination.limit_per_page') }}</label>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const perPageValues = [5, 10, 100, 1000, 10000, 100000, 1000000];

const props = defineProps({
    items: {
        type: Object,
        required: true
    },
    setItems: {
        type: Function,
        required: true
    },
    onSelect: {
        type: Function,
        required: true
    },
    bgClassName: {
        type: String,
        required: false
    },
    defaultPerPage: {
        type: Number,
        required: false
    }
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

// Фильтрация ссылок, чтобы убрать те, у которых нет URL
const filteredLinks = computed(() => props.items.links.filter(link => link.url));

const getButtonTitle = (label) => {
    if (label === 'pagination.previous') {
        return t('pagination.previous_page_title');
    } else if (label === 'pagination.next') {
        return t('pagination.next_page_title');
    }
    return label;
};
</script>