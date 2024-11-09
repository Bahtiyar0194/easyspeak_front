<template>
    <th class="cursor-pointer" @click="sortTable()"
        :title="props.sortKey !== props.keyName ? $t('sort_by_this_column') : (props.sortDirection === 'asc' ? $t('sort_asc') : $t('sort_desc'))">
        <div class="flex items-center gap-1">
            <span>{{ props.title }}</span>
            <i v-if="props.sortKey === props.keyName" class="pi text-[10px] text-corp"
                :class="props.sortDirection === 'asc' ? ('pi-sort-' + props.sortType + '-down') : 'pi-sort-' + props.sortType + '-down-alt'"></i>
        </div>
    </th>
</template>

<script setup>
const props = defineProps({
    title: {
        type: String,
        required: true
    },
    keyName: {
        type: String,
        required: true
    },
    sortKey: {
        type: String,
        required: true
    },
    sortDirection: {
        type: String,
        required: true
    },
    //Тип сортировки alpha, numeric, amount. По умолчанию alpha
    sortType: {
        default: 'alpha',
        type: String,
        required: false
    },
    sortHandler: {
        type: Function,
        required: true
    }
});

// Используем emit для отправки события в родительский компонент
const emit = defineEmits(['update:sortKey', 'update:sortDirection']);

// Функция для сортировки таблицы
const sortTable = () => {
    let newDirection = 'asc';

    if (props.sortKey === props.keyName) {
        newDirection = props.sortDirection === 'asc' ? 'desc' : 'asc';
    }

    // Передаем изменения в родительский компонент
    emit('update:sortKey', props.keyName);
    emit('update:sortDirection', newDirection);

    props.sortHandler();
}
</script>