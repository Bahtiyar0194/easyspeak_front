<template>
    <div class="col-span-12">
        <draggable v-model="list" :group="'people'" :disabled="!enabled" itemKey="id" @start="dragging = true"
            @end="dragging = false" @update="log">
            <template #item="{ element }">
                <div :key="element.id" class="draggable-word">{{ element.name }}</div>
            </template>
        </draggable>
    </div>
</template>

<script setup>
import draggable from 'vuedraggable';
const { t } = useI18n();

useHead({
    title: t('pages.dashboard.title'),
    meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
    layout: "dashboard",
    middleware: ['sanctum:auth']
});

import { ref } from 'vue'

// Инициализация данных
const enabled = ref(true);

const list = ref([
    { name: 'John', id: 1 },
    { name: 'Joao', id: 2 },
    { name: 'Jean', id: 3 },
    { name: 'Gerard', id: 4 },
]);

const dragging = ref(false);

// Функция логирования событий
function log(event) {
    console.log(event)
}
</script>

<style scoped>
/* Плавное перемещение для draggable элементов */
.draggable-word {
    background-color: #fff;
    padding: 5px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: transform 0.3s ease, opacity 0.3s ease, top 0.3s ease, left 0.3s ease;
    /* transition на top и left добавляет плавность при перемещении */
}

.draggable-word:hover {
    transform: scale(1.05);
}

/* Дополнительные стили */
.drag-drop-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.phrases-column {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 200px;
}

.phrase-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px;
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.drop-area {
    min-width: 100px;
    min-height: 30px;
    background-color: #e3e3e3;
    border: 1px dashed #bbb;
    padding: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
}

.matched-word {
    background-color: #d1e7dd;
    padding: 3px 5px;
    border-radius: 3px;
}

.words-container {
    width: 100%;
    display: flex;
    justify-content: center;
}

.words-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}
</style>