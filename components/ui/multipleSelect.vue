<template>
    <div :class="props.className" ref="selectWrapper" tabindex="0">
        <i :class="props.icon"></i>
        <input class="cursor-pointer"
            :value="checkedCount > 0 ? ($t('selected') + ': ' + checkedCount) : $t('not_selected')"
            @click="toggleSelect" readonly>

        <button :class="checkedCount > 0 ? 'block' : 'hidden'" type="button" @click="resetAllCheckboxes"
            class="clear mr-5 -mt-1">
            <i class="pi pi-times text-xs text-danger"></i>
        </button>

        <div v-if="props.items && props.items.length > 0" class="multiple-select-menu-wrap"
            :class="{ show: selectMenuOpen === true }" ref="selectMenu">

            <div class="form-group-border mt-4 active label-active w-full">
                <i class="pi pi-search"></i>
                <input v-model="searchTerm" type="text" placeholder=" " @input="filterOptions" />
                <label>
                    {{ $t('search') }}
                </label>
                <button :class="searchTerm != '' ? 'block' : 'hidden'" type="button" @click="searchTerm = ''"
                    class="clear -mt-1">
                    <i class="pi pi-times text-xs text-danger"></i>
                </button>
            </div>

            <p class="text-inactive mt-2" v-if="filteredItems?.length === 0">{{ $t("nothing_was_found_for_your_query")
                }}
            </p>

            <ul class="multiple-select-menu">
                <li v-for="(item, index) in filteredItems" :key="index">
                    <label class="custom-radio-checkbox w-full whitespace-nowrap" :class="props.avatar && 'avatar'">
                        <input type="checkbox" :name="props.optionName" :value="item[props.optionValue]"
                            @change="handleCheckboxChange" />
                        <span v-if="!props.avatar">{{ item[props.optionLabel] }}</span>
                        <span v-else>
                            <div class="flex gap-x-1 items-center">
                                <userAvatar :padding="0.5" :className="'w-5 h-5 text-[10px]'" :user="item"
                                    :isChecked="isCheckboxChecked(item[props.optionValue])" />
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import userAvatar from './userAvatar.vue';

const selectWrapper = ref(null);
const selectMenu = ref(null);
const selectMenuOpen = ref(false);
const checkedCount = ref(0);
const searchTerm = ref('');

const props = defineProps({
    icon: {
        type: String,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    className: {
        type: String,
        required: false
    },
    items: {
        type: Array,
        required: true,
        default: () => []
    },
    optionName: {
        type: String,
        required: true
    },
    optionValue: {
        type: String,
        required: true
    },
    optionLabel: {
        type: String,
        required: true
    },
    avatar: {
        type: Boolean,
        required: false
    },
    onChange: {
        type: Function,
        required: true
    }
});

// Фильтр для поиска по опциям
const filteredItems = computed(() => {
    if (!searchTerm.value) return props.items;
    return props.items.filter(item =>
        item[props.optionLabel].toLowerCase().includes(searchTerm.value.toLowerCase())
    );
});

const isCheckboxChecked = (value) => {
    const checkbox = selectMenu.value?.querySelector(`input[type="checkbox"][value="${value}"]`);
    return checkbox ? checkbox.checked : false;
};

// Обработчик изменения состояния чекбоксов
const handleCheckboxChange = (event) => {
    const target = event.target;

    if (target && target.matches('input[type="checkbox"]')) {
        // Обновляем количество checked чекбоксов
        const allCheckboxes = selectMenu.value.querySelectorAll('input[type="checkbox"]');
        const checkedCheckboxes = Array.from(allCheckboxes).filter(checkbox => checkbox.checked);
        checkedCount.value = checkedCheckboxes.length;

        props.onChange();
    }
};

const resetAllCheckboxes = () => {
    const allCheckboxes = selectMenu.value.querySelectorAll('input[type="checkbox"]');

    allCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    checkedCount.value = 0;
    props.onChange();
};


// Обработчик кликов вне компонента
const handleClickOutside = (event) => {
    if (selectWrapper.value && !selectWrapper.value.contains(event.target)) {
        selectMenuOpen.value = false;
    }
};

// Обработчик для сброса формы
const handleFormReset = () => {
    checkedCount.value = 0;
    searchTerm.value = '';
};

// Закрытие меню по клавише Escape
const handleKeyPress = (event) => {
    if (event.key === 'Escape') {
        selectMenuOpen.value = false;
    }
};

onMounted(() => {
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyPress);

    if (selectMenu.value) {
        selectMenu.value.addEventListener('change', handleCheckboxChange);
    }

    // Отслеживаем сброс формы
    const formElement = selectWrapper.value.closest('form');
    if (formElement) {
        formElement.addEventListener('reset', handleFormReset); // Слушаем сброс формы
    }
});

onBeforeUnmount(() => {
    window.removeEventListener('click', handleClickOutside);
    window.removeEventListener('keydown', handleKeyPress);

    if (selectMenu.value) {
        selectMenu.value.removeEventListener('change', handleCheckboxChange);
    }

    const formElement = selectWrapper.value.closest('form');
    if (formElement) {
        formElement.removeEventListener('reset', handleFormReset);
    }
});

const toggleSelect = () => {
    selectMenuOpen.value = !selectMenuOpen.value;
};
</script>