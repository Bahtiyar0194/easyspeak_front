<template>
    <div class="cursor-pointer" :class="props.className" @click="showSelect" ref="selectWrapper">
        <i :class="props.icon"></i>
        <input :value="checkedCount > 0 ? ($t('selected') + ': ' + checkedCount) : $t('not_selected')" disabled
            class="pointer-events-none">
        <ul class="multiple-select-menu" ref="selectMenu" :class="{ show: selectMenuOpen === true }">
            <slot />
        </ul>
        <label>{{ props.label }}</label>
    </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
const selectWrapper = ref(null);
const selectMenu = ref(null);
const selectMenuOpen = ref(false);

const checkedCount = ref(0);

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
    }
});

// Обработчик изменения состояния чекбоксов
const handleCheckboxChange = (event) => {
    const target = event.target;

    if (target && target.matches('input[type="checkbox"]')) {
        // Обновляем количество checked чекбоксов
        const allCheckboxes = selectMenu.value.querySelectorAll('input[type="checkbox"]');
        const checkedCheckboxes = Array.from(allCheckboxes).filter(checkbox => checkbox.checked);
        checkedCount.value = checkedCheckboxes.length;
    }
};

const handleClickOutside = (event) => {
    if (selectWrapper.value && !selectWrapper.value.contains(event.target)) {
        selectMenuOpen.value = false;
    }
};

// Обработчик для сброса формы
const handleFormReset = () => {
    checkedCount.value = 0; // Сбрасываем счетчик
};

onMounted(() => {
    window.addEventListener('click', handleClickOutside);

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

    if (selectMenu.value) {
        selectMenu.value.removeEventListener('change', handleCheckboxChange);
    }

    const formElement = selectWrapper.value.closest('form');
    if (formElement) {
        formElement.removeEventListener('reset', handleFormReset);
    }
});

const showSelect = () => {
    selectMenuOpen.value = true;
}
</script>