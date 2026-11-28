<template>
    <div class="board" :class="{ 'is-panning': panning || spacePressed }">
        <!-- Холст Fabric.js: бесконечная доска с объектами. Сетка — фоном
             контейнера, двигается и масштабируется вместе с видом -->
        <div ref="stage" class="board-stage" :style="gridStyle" @wheel.prevent="onWheel">
            <canvas ref="canvasEl"></canvas>
        </div>

        <!-- Слева сверху: действия -->
        <div ref="actionsBar" class="board-actions" role="group">
            <template v-if="!readOnly">
            <button type="button" class="board-btn" :title="$t('board.actions.undo')" :aria-label="$t('board.actions.undo')"
                :disabled="!undoCount" @click="undo">
                <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>
            </button>
            <button type="button" class="board-btn" :title="$t('board.actions.redo')" :aria-label="$t('board.actions.redo')"
                :disabled="!redoCount" @click="redo">
                <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
            </button>
            <!-- Картинка из материалов урока (если их нет — так и пишем в окне) -->
            <button type="button" class="board-btn" :class="{ active: imagesOpen }"
                :aria-expanded="imagesOpen" :title="$t('board.insert_image')" :aria-label="$t('board.insert_image')"
                @click="toggleImages">
                <i class="bi bi-image" aria-hidden="true"></i>
            </button>
            </template>
            <template v-if="hasSelection && !readOnly">
                <button type="button" class="board-btn" :title="$t('board.actions.to_back')"
                    :aria-label="$t('board.actions.to_back')" @click="sendSelectionToBack">
                    <i class="bi bi-layer-backward" aria-hidden="true"></i>
                </button>
                <button type="button" class="board-btn danger" :title="$t('board.actions.delete')"
                    :aria-label="$t('board.actions.delete')" @click="deleteSelection">
                    <i class="bi bi-trash3" aria-hidden="true"></i>
                </button>
            </template>
            <button type="button" class="board-btn" :class="{ active: moreOpen }" :aria-expanded="moreOpen"
                :title="$t('board.more')" :aria-label="$t('board.more')" @click="moreOpen = !moreOpen">
                <i class="bi bi-three-dots" aria-hidden="true"></i>
            </button>

            <!-- Выбор картинки из материалов урока -->
            <div v-if="imagesOpen" class="board-menu board-picker">
                <p class="board-panel-label px-1 pt-1">{{ $t('board.lesson_images') }}</p>
                <div v-if="!imageMaterials.length" class="board-picker-empty">
                    <i :class="materials.length ? 'bi bi-image' : 'bi bi-folder2-open'" aria-hidden="true"></i>
                    <span>{{ materials.length ? $t('materials.no_images') : $t('materials.no_materials') }}</span>
                </div>
                <div v-else class="board-picker-grid">
                    <button v-for="material in imageMaterials" :key="material.lesson_material_id" type="button"
                        class="board-picker-item" :title="material.annotation" @click="insertImage(material)">
                        <img :src="mediaUrl(material.target)" alt="" loading="lazy" />
                        <span v-if="material.annotation">{{ material.annotation }}</span>
                    </button>
                </div>
            </div>

            <div v-if="moreOpen" class="board-menu" role="menu">
                <button type="button" role="menuitem" @click="moreOpen = false; saveAsImage()">
                    <i class="bi bi-download" aria-hidden="true"></i>
                    {{ $t('board.actions.save') }}
                </button>
                <button v-if="!readOnly" type="button" role="menuitem" class="danger" :disabled="!objectCount"
                    @click="moreOpen = false; confirmClear()">
                    <i class="bi bi-trash" aria-hidden="true"></i>
                    {{ $t('board.actions.clear') }}
                </button>
            </div>
        </div>

        <!-- Справа сверху: масштаб (на телефоне — только % и «показать всё»,
             масштабируют там щипком) -->
        <div class="board-zoom" role="group">
            <button type="button" class="board-btn max-sm:hidden" :title="$t('board.zoom_out')" :aria-label="$t('board.zoom_out')"
                :disabled="scale <= MIN_ZOOM" @click="zoomStep(-1)">
                <i class="bi bi-dash-lg" aria-hidden="true"></i>
            </button>
            <button type="button" class="board-zoom-value" :title="$t('board.zoom_reset')" @click="zoomTo(1)">
                {{ Math.round(scale * 100) }}%
            </button>
            <button type="button" class="board-btn max-sm:hidden" :title="$t('board.zoom_in')" :aria-label="$t('board.zoom_in')"
                :disabled="scale >= MAX_ZOOM" @click="zoomStep(1)">
                <i class="bi bi-plus-lg" aria-hidden="true"></i>
            </button>
            <button type="button" class="board-btn" :title="$t('board.zoom_fit')" :aria-label="$t('board.zoom_fit')"
                @click="fitToContent()">
                <i class="bi bi-arrows-fullscreen" aria-hidden="true"></i>
            </button>
        </div>

        <!-- Снизу: подсказка, панели, инструменты -->
        <div ref="dock" class="board-dock">
            <!-- Режим доски для ученика (у учителя переключатель — в шапке окна) -->
            <div v-if="!canManage" class="board-status">
                <span class="board-chip board-access-chip" :class="{ locked: !learnersCanEdit }" role="status">
                    <i :class="learnersCanEdit ? 'bi bi-people-fill' : 'bi bi-lock-fill'" aria-hidden="true"></i>
                    <span>{{ accessLabel }}</span>
                </span>
            </div>
            <div v-if="loading || imageLoading || showHint" class="board-status" aria-live="polite">
                <span v-if="loading || imageLoading" class="board-chip">
                    <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
                    {{ $t('loading') }}
                </span>
                <span v-else class="board-chip">
                    <i class="bi bi-info-circle" aria-hidden="true"></i>
                    <span>{{ isTouch ? $t('board.hint_touch') : $t('board.hint_mouse') }}</span>
                    <button type="button" class="board-chip-close" :aria-label="$t('close')" @click="dismissHint">
                        <i class="bi bi-x" aria-hidden="true"></i>
                    </button>
                </span>
            </div>

            <!-- Выбор инструмента внутри группы (Рисование, Фигуры) -->
            <div v-if="groupPanel && !readOnly" class="board-panel board-group-panel" role="menu">
                <button v-for="name in groupPanel.tools" :key="name" type="button" role="menuitemradio"
                    class="board-group-item" :class="{ active: tool === name }" :aria-checked="tool === name"
                    @click="pickTool(name)">
                    <i :class="toolIcon(name)" aria-hidden="true"></i>
                    <span>{{ $t('board.tools.' + name) }}</span>
                </button>
            </div>

            <div v-else-if="panelOpen && toolDef.params && !readOnly" class="board-panel">
                <div v-if="toolDef.params.stroke">
                    <p class="board-panel-label">
                        {{ tool === 'text' ? $t('board.params.text_color') : $t('board.params.border_color') }}
                    </p>
                    <div class="board-colors">
                        <button v-for="color in strokeColors" :key="color" type="button" class="board-color"
                            :class="{ selected: lineColor === color }" :style="{ backgroundColor: color }"
                            :aria-label="color" :aria-pressed="lineColor === color" @click="lineColor = color"></button>
                    </div>
                </div>

                <div v-if="toolDef.params.fill">
                    <p class="board-panel-label">{{ $t('board.params.fill_color') }}</p>
                    <div class="board-colors">
                        <button v-for="color in colors" :key="color" type="button" class="board-color"
                            :class="{ selected: fillColor === color, transparent: color === TRANSPARENT }"
                            :style="color === TRANSPARENT ? null : { backgroundColor: color }"
                            :aria-label="color" :aria-pressed="fillColor === color" @click="fillColor = color"></button>
                    </div>
                </div>

                <div v-if="toolDef.params.width">
                    <p class="board-panel-label">{{ $t('board.params.border_width') }}</p>
                    <lineWidthSelect :width="lineWidth" :color="lineColor" :tool_name="tool"
                        :onSelect="(width) => (lineWidth = width)" />
                </div>

                <div v-if="toolDef.params.font">
                    <fontSelect :size="String(fontSize)" :onSelect="(size) => (fontSize = Number(size))" />
                </div>
            </div>

            <!-- Группы инструментов: в группе видна последняя выбранная,
                 повторное нажатие — выбор внутри группы -->
            <div v-if="!readOnly" class="board-toolbar" role="toolbar">
                <button v-for="group in toolGroups" :key="group.key" type="button" class="board-btn"
                    :class="{ active: activeGroup === group.key, grouped: group.tools.length > 1 }"
                    :aria-pressed="activeGroup === group.key"
                    :title="$t('board.tools.' + groupTool(group))" :aria-label="$t('board.tools.' + groupTool(group))"
                    @click="onGroupClick(group)">
                    <i :class="toolIcon(groupTool(group))" aria-hidden="true"></i>
                </button>

                <template v-if="toolDef.params">
                    <span class="board-divider" aria-hidden="true"></span>
                    <button type="button" class="board-btn" :class="{ active: panelOpen }" :aria-expanded="panelOpen"
                        :title="$t('board.style')" :aria-label="$t('board.style')" @click="toggleStylePanel">
                        <span class="board-swatch" :style="{ backgroundColor: toolDef.params.stroke ? lineColor : '#94a3b8' }"></span>
                    </button>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup>
// Доска на объектах (Fabric.js). Каждый штрих, фигура и текст — отдельный
// объект с id. Участники обмениваются событиями board:add / update / remove /
// clear, а сервер сокетов хранит доску комнаты: опоздавший получает её целиком
// (board:get). Пока объект рисуют, остальные видят черновик (board:draft).
// Отмена (Ctrl+Z) у каждого своя — отменяются только свои действия.
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import lineWidthSelect from './board/lineWidthSelect.vue';
import fontSelect from './board/fontSelect.vue';
import { colors } from '../../utils/colors';
import { useConfirm } from '~/composables/useConfirm';
import { useNotify } from '~/composables/useNotify';

const props = defineProps({
    // Не используется (раньше — «рассылать ли»), оставлено для совместимости
    streams_length: {
        type: Number,
        default: 0
    },
    // Доска на экране (окно открыто). Пока закрыта — горячие клавиши не ловим
    active: {
        type: Boolean,
        default: true
    },
    // Материалы урока: картинки из них можно положить на доску
    materials: {
        type: Array,
        default: () => []
    },
    // Учитель: рисует всегда и разрешает / запрещает рисовать ученикам
    canManage: {
        type: Boolean,
        default: false
    }
});

// ===== Совместное редактирование =====
// По умолчанию рисует только учитель. Разрешение хранит сервер сокетов
// (board:access) и сам отбрасывает правки учеников, пока оно выключено
const learnersCanEdit = ref(false);
const accessPending = ref(false);
const readOnly = computed(() => !props.canManage && !learnersCanEdit.value);

const accessLabel = computed(() => {
    if (props.canManage) {
        return learnersCanEdit.value ? t('board.access.teacher_open') : t('board.access.teacher_locked');
    }
    return learnersCanEdit.value ? t('board.access.learner_open') : t('board.access.learner_locked');
});

const toggleLearnersAccess = () => {
    if (!props.canManage || accessPending.value) return;
    accessPending.value = true;
    $socketPlugin.timeout(5000).emit('board:set-access', !learnersCanEdit.value, (err, res) => {
        accessPending.value = false;
        if (err || !res?.success) {
            notify('danger', t('board.access.failed'));
            return;
        }
        learnersCanEdit.value = Boolean(res.learnersCanEdit);
    });
};

// Для шапки окна доски: режим и переключатель
defineExpose({ learnersCanEdit, accessPending, toggleLearnersAccess });

// Сообщаем серверу, кто я на доске (до загрузки доски и после переподключения)
const sendRole = () => $socketPlugin.emit('board:role', { canManage: props.canManage });

const { $socketPlugin, $hammer } = useNuxtApp();
const { t } = useI18n();
const confirm = useConfirm();
const notify = useNotify();
const config = useRuntimeConfig();

const mediaUrl = (file) => config.public.apiBase + '/media/get/' + file;
const imageMaterials = computed(() =>
    (props.materials || []).filter((m) => m.file_material_type_slug === 'image' && m.target)
);

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEPS = [0.1, 0.25, 0.33, 0.5, 0.67, 0.8, 1, 1.25, 1.5, 2, 3, 4, 5];
const GRID = 20;
const TRANSPARENT = '#FFFFFF00';
const HINT_KEY = 'board-hint-dismissed';
const HISTORY_LIMIT = 100;
const DRAFT_INTERVAL = 50;   // мс между отправками черновика
const ERASER_TOLERANCE = 10; // px экрана вокруг указателя
const strokeColors = colors.filter((c) => c !== TRANSPARENT);

// ===== Инструменты =====
const tools = [
    { name: 'select', icon: 'bi bi-cursor', params: null },
    { name: 'move', icon: 'bi bi-hand-index', params: null },
    { name: 'pencil', icon: 'bi bi-pencil', params: { stroke: true } },
    { name: 'brush', icon: 'bi bi-brush', params: { stroke: true, width: true } },
    { name: 'highlighter', icon: 'bi bi-highlighter', params: { stroke: true, width: true } },
    { name: 'line', icon: 'bi bi-slash-lg', params: { stroke: true, width: true } },
    { name: 'arrow', icon: 'bi bi-arrow-up-right', params: { stroke: true, width: true } },
    { name: 'rectangle', icon: 'bi bi-square', params: { stroke: true, fill: true, width: true } },
    { name: 'circle', icon: 'bi bi-circle', params: { stroke: true, fill: true, width: true } },
    { name: 'text', icon: 'bi bi-type', params: { stroke: true, font: true } },
    { name: 'eraser', icon: 'bi bi-eraser-fill', params: null }
];
const STROKE_TOOLS = ['pencil', 'brush', 'highlighter'];
const SHAPE_TOOLS = ['line', 'arrow', 'rectangle', 'circle'];

// По умолчанию — карандаш: открыли доску и сразу рисуем
const tool = ref('pencil');
const toolDef = computed(() => tools.find((x) => x.name === tool.value));
const panelOpen = ref(false);   // панель цвета/толщины
const groupPanel = ref(null);   // открытая группа инструментов
const moreOpen = ref(false);    // меню «⋯» (сохранить, очистить)
const imagesOpen = ref(false);  // выбор картинки из материалов урока
const imageLoading = ref(false);

// Группы — чтобы панель помещалась на телефоне (7 кнопок вместо 12)
const toolGroups = [
    { key: 'select', tools: ['select'] },
    { key: 'move', tools: ['move'] },
    { key: 'draw', tools: ['pencil', 'brush', 'highlighter'] },
    { key: 'shapes', tools: ['line', 'arrow', 'rectangle', 'circle'] },
    { key: 'text', tools: ['text'] },
    { key: 'eraser', tools: ['eraser'] }
];
// Последний выбранный инструмент в каждой группе
const groupLast = reactive({ draw: 'pencil', shapes: 'rectangle' });

const toolIcon = (name) => tools.find((x) => x.name === name)?.icon;
const groupOf = (name) => toolGroups.find((g) => g.tools.includes(name));
const groupTool = (group) => groupLast[group.key] || group.tools[0];
const activeGroup = computed(() => groupOf(tool.value)?.key);

const closePanels = () => {
    panelOpen.value = false;
    groupPanel.value = null;
    moreOpen.value = false;
    imagesOpen.value = false;
};

const toggleImages = () => {
    const open = imagesOpen.value;
    closePanels();
    imagesOpen.value = !open;
};

const onGroupClick = (group) => {
    const isActive = activeGroup.value === group.key;
    if (isActive && group.tools.length > 1) {
        // Повторное нажатие на группу — выбрать инструмент внутри неё
        const open = groupPanel.value?.key === group.key;
        closePanels();
        if (!open) groupPanel.value = group;
        return;
    }
    if (isActive && toolDef.value.params) {
        toggleStylePanel();
        return;
    }
    closePanels();
    tool.value = groupTool(group);
};

const pickTool = (name) => {
    const group = groupOf(name);
    if (group && group.tools.length > 1) groupLast[group.key] = name;
    closePanels();
    tool.value = name;
};

const toggleStylePanel = () => {
    const open = panelOpen.value;
    closePanels();
    panelOpen.value = !open;
};

const lineColor = ref('#000000');
const fillColor = ref(TRANSPARENT);
const fontSize = ref(28);
// Толщина своя у каждого инструмента
const toolWidths = reactive({ brush: 4, highlighter: 16, line: 4, arrow: 4, rectangle: 4, circle: 4 });
const lineWidth = computed({
    get: () => toolWidths[tool.value] ?? 4,
    set: (value) => { toolWidths[tool.value] = value; }
});

// ===== Состояние для интерфейса (сами объекты Fabric — вне реактивности) =====
const stage = ref(null);
const canvasEl = ref(null);
const dock = ref(null);
const actionsBar = ref(null);
const loading = ref(true);
const scale = ref(1);
const viewOffset = reactive({ x: 0, y: 0 });
const hasSelection = ref(false);
const objectCount = ref(0);
const undoCount = ref(0);
const redoCount = ref(0);
const panning = ref(false);
const spacePressed = ref(false);
const isTouch = ref(false);
const showHint = ref(false);

const gridStyle = computed(() => ({
    backgroundSize: `${GRID * scale.value}px ${GRID * scale.value}px`,
    backgroundPosition: `${viewOffset.x}px ${viewOffset.y}px`
}));

let F = null;          // модуль fabric (грузится только при открытии доски)
let canvas = null;
let hammer = null;
let resizeObserver = null;
const byId = new Map(); // id -> объект на холсте (без черновиков)

const newId = () =>
    (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 36);

const round = (n) => Math.round(n * 10) / 10;

// В Fabric 6 obj.type — в нижнем регистре ('itext'), поэтому через instanceof
const isText = (obj) => Boolean(obj && F && obj instanceof F.IText);

// ===== Вид: масштаб и перемещение =====
const syncViewport = () => {
    if (!canvas) return;
    const vpt = canvas.viewportTransform;
    scale.value = vpt[0];
    viewOffset.x = vpt[4];
    viewOffset.y = vpt[5];
};

const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

// point — в координатах экрана холста (viewport); без него — центр
const zoomTo = (z, point = null) => {
    if (!canvas) return;
    const p = point || new F.Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
    canvas.zoomToPoint(p, clampZoom(z));
    syncViewport();
    canvas.requestRenderAll();
};

const zoomStep = (direction) => {
    const current = scale.value;
    const next = direction > 0
        ? ZOOM_STEPS.find((s) => s > current + 0.001)
        : [...ZOOM_STEPS].reverse().find((s) => s < current - 0.001);
    if (next) zoomTo(next);
};

const panBy = (dx, dy) => {
    if (!canvas) return;
    canvas.relativePan(new F.Point(dx, dy));
    syncViewport();
};

// Ctrl + колесо (щипок на тачпаде) — масштаб, колесо — прокрутка
const onWheel = (e) => {
    if (!canvas) return;
    if (e.ctrlKey || e.metaKey) {
        const rect = stage.value.getBoundingClientRect();
        zoomTo(scale.value * Math.pow(0.999, e.deltaY * 2), new F.Point(e.clientX - rect.left, e.clientY - rect.top));
        dismissHint();
        return;
    }
    const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
    const dy = e.shiftKey && !e.deltaX ? 0 : e.deltaY;
    panBy(-dx, -dy);
};

// Показать всё нарисованное
const fitToContent = () => {
    if (!canvas) return;
    const box = contentBounds();
    if (!box) {
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        syncViewport();
        return;
    }
    const pad = 40;
    const w = canvas.getWidth();
    const h = canvas.getHeight();
    const z = clampZoom(Math.min((w - pad * 2) / Math.max(box.width, 1), (h - pad * 2) / Math.max(box.height, 1), 2));
    canvas.setViewportTransform([
        z, 0, 0, z,
        (w - box.width * z) / 2 - box.left * z,
        (h - box.height * z) / 2 - box.top * z
    ]);
    syncViewport();
};

const realObjects = () => (canvas ? canvas.getObjects().filter((o) => !o.isDraft) : []);

const contentBounds = () => {
    const objs = realObjects();
    if (!objs.length) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    objs.forEach((o) => {
        const r = o.getBoundingRect();
        minX = Math.min(minX, r.left);
        minY = Math.min(minY, r.top);
        maxX = Math.max(maxX, r.left + r.width);
        maxY = Math.max(maxY, r.top + r.height);
    });
    return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
};

// ===== Объекты: создание, сериализация, применение =====
const serialize = (obj) => obj.toObject();

// Свойства, которые не сохраняются в JSON, а зависят от режима
const prepareObject = (obj) => {
    obj.perPixelTargetFind = true; // выделяется по нарисованному, а не по рамке
    obj.strokeUniform = true;
    applyInteractivity(obj);
    return obj;
};

const applyInteractivity = (obj) => {
    const on = tool.value === 'select' || (tool.value === 'text' && isText(obj));
    obj.selectable = on && !obj.isDraft;
    obj.evented = on && !obj.isDraft;
};

const refreshCounts = () => {
    objectCount.value = byId.size;
};

const addObject = (obj, index = null) => {
    prepareObject(obj);
    if (index === null || index >= canvas.getObjects().length) canvas.add(obj);
    else canvas.insertAt(index, obj);
    byId.set(obj.id, obj);
};

const removeObject = (id) => {
    const obj = byId.get(id);
    if (!obj) return null;
    if (canvas.getActiveObjects().includes(obj)) canvas.discardActiveObject();
    canvas.remove(obj);
    byId.delete(id);
    return obj;
};

// Добавить/заменить объекты из JSON (свои при отмене или пришедшие от других)
const applyAdd = async (jsons) => {
    const list = jsons.filter((j) => j && j.id);
    if (!list.length) return;
    const objs = await F.util.enlivenObjects(list);
    objs.forEach((obj, i) => {
        const existing = byId.get(list[i].id);
        // Объект сейчас тянут/вращают у нас — не выдёргиваем из-под руки:
        // наше изменение уйдёт следом и станет последним
        if (existing && canvas._currentTransform && canvas.getActiveObjects().includes(existing)) return;
        if (existing) {
            const index = canvas.getObjects().indexOf(existing);
            removeObject(existing.id);
            addObject(obj, index);
        } else {
            removeDraft(list[i].id); // черновик этого объекта больше не нужен
            addObject(obj);
        }
    });
    refreshCounts();
    canvas.requestRenderAll();
};

const applyUpdate = async (jsons) => {
    // Обновляем только существующие: удалённый другим не воскрешаем
    await applyAdd(jsons.filter((j) => byId.has(j.id)));
};

const applyRemove = (ids) => {
    ids.forEach(removeObject);
    refreshCounts();
    canvas.requestRenderAll();
};

const applyClear = () => {
    canvas.discardActiveObject();
    realObjects().forEach((o) => canvas.remove(o));
    byId.clear();
    refreshCounts();
    canvas.requestRenderAll();
};

// Изменения доски применяются строго по очереди: создание объекта из JSON
// асинхронное, и «изменить» не должно обогнать «добавить»
let queue = Promise.resolve();
const enqueue = (fn) => {
    queue = queue.then(() => (canvas ? fn() : null)).catch((e) => console.error('[board]', e));
    return queue;
};

// ===== Сокет =====
const send = (event, data) => {
    if (readOnly.value) return;
    if (data === undefined) $socketPlugin.emit(event);
    else $socketPlugin.emit(event, data);
};

// ===== История (только свои действия) =====
const undoStack = [];
const redoStack = [];

const pushHistory = (op) => {
    undoStack.push(op);
    if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
    redoStack.length = 0;
    undoCount.value = undoStack.length;
    redoCount.value = 0;
};

// Применить операцию в прямом (redo) или обратном (undo) направлении
const runOp = async (op, reverse) => {
    const kind = reverse
        ? { add: 'remove', remove: 'add', update: 'update', clear: 'unclear' }[op.type]
        : op.type;

    if (kind === 'add' || kind === 'unclear') {
        await applyAdd(op.objs);
        send('board:add', op.objs);
    } else if (kind === 'remove') {
        const ids = op.objs.map((o) => o.id);
        applyRemove(ids);
        send('board:remove', ids);
    } else if (kind === 'update') {
        const objs = reverse ? op.before : op.after;
        await applyUpdate(objs);
        send('board:update', objs);
    } else if (kind === 'clear') {
        applyClear();
        send('board:clear');
    }
};

const undo = () => {
    const op = undoStack.pop();
    if (!op) return;
    redoStack.push(op);
    undoCount.value = undoStack.length;
    redoCount.value = redoStack.length;
    enqueue(() => runOp(op, true));
};

const redo = () => {
    const op = redoStack.pop();
    if (!op) return;
    undoStack.push(op);
    undoCount.value = undoStack.length;
    redoCount.value = redoStack.length;
    enqueue(() => runOp(op, false));
};

// Последнее известное состояние объектов — «до» для отмены перемещения/правки
const lastJson = new Map();
const remember = (jsons) => jsons.forEach((j) => lastJson.set(j.id, j));

// ===== Черновики: что сейчас рисуют другие =====
const drafts = new Map(); // id -> { points, style, obj, timer }

const removeDraft = (id) => {
    const draft = drafts.get(id);
    if (!draft) return;
    clearTimeout(draft.timer);
    if (draft.obj) canvas.remove(draft.obj);
    drafts.delete(id);
    canvas.requestRenderAll();
};

const asDraft = (obj) => {
    obj.isDraft = true;
    obj.selectable = false;
    obj.evented = false;
    obj.excludeFromExport = true;
    return obj;
};

const onRemoteDraft = async (data) => {
    if (!data || !data.id || byId.has(data.id)) return;
    let draft = drafts.get(data.id);
    if (!draft) {
        draft = { points: [], style: null, obj: null, timer: null };
        drafts.set(data.id, draft);
    }
    // Автор пропал посреди штриха — убираем черновик
    clearTimeout(draft.timer);
    draft.timer = setTimeout(() => removeDraft(data.id), 10000);

    let next = null;
    if (data.kind === 'stroke') {
        if (data.style) draft.style = data.style;
        if (Array.isArray(data.points)) draft.points.push(...data.points);
        if (!draft.style || !draft.points.length) return;
        next = makeStroke(draft.points, draft.style);
    } else if (data.kind === 'shape' && data.json) {
        [next] = await F.util.enlivenObjects([data.json]);
    }
    if (!next || !drafts.has(data.id)) return;
    if (draft.obj) canvas.remove(draft.obj);
    draft.obj = asDraft(next);
    canvas.add(draft.obj);
    canvas.requestRenderAll();
};

// ===== Построение фигур =====
const strokePath = (pts) => {
    if (pts.length === 1) {
        const [x, y] = pts[0];
        return `M ${x} ${y} L ${x + 0.01} ${y + 0.01}`;
    }
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[i + 1];
        d += ` Q ${x1} ${y1} ${round((x1 + x2) / 2)} ${round((y1 + y2) / 2)}`;
    }
    const last = pts[pts.length - 1];
    return d + ` L ${last[0]} ${last[1]}`;
};

const strokeStyle = () => {
    const name = tool.value;
    return {
        tool: name,
        color: lineColor.value,
        width: name === 'pencil' ? 2 : lineWidth.value,
        opacity: name === 'highlighter' ? 0.4 : 1
    };
};

const makeStroke = (pts, style) =>
    new F.Path(strokePath(pts), {
        fill: null,
        stroke: style.color,
        strokeWidth: style.width,
        opacity: style.opacity ?? 1,
        strokeLineCap: style.tool === 'highlighter' ? 'butt' : 'round',
        strokeLineJoin: 'round'
    });

const makeShape = (name, a, b) => {
    const stroke = lineColor.value;
    const strokeWidth = lineWidth.value;

    if (name === 'line' || name === 'arrow') {
        let d = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
        if (name === 'arrow') {
            const angle = Math.atan2(b.y - a.y, b.x - a.x);
            const head = Math.max(12, strokeWidth * 3.5);
            const p1 = { x: b.x - head * Math.cos(angle - Math.PI / 7), y: b.y - head * Math.sin(angle - Math.PI / 7) };
            const p2 = { x: b.x - head * Math.cos(angle + Math.PI / 7), y: b.y - head * Math.sin(angle + Math.PI / 7) };
            d += ` M ${round(p1.x)} ${round(p1.y)} L ${b.x} ${b.y} L ${round(p2.x)} ${round(p2.y)}`;
        }
        return new F.Path(d, { fill: null, stroke, strokeWidth, strokeLineCap: 'round', strokeLineJoin: 'round' });
    }

    const left = Math.min(a.x, b.x);
    const top = Math.min(a.y, b.y);
    const width = Math.abs(b.x - a.x);
    const height = Math.abs(b.y - a.y);

    if (name === 'rectangle') {
        return new F.Rect({ left, top, width, height, fill: fillColor.value, stroke, strokeWidth, strokeUniform: true });
    }
    return new F.Ellipse({ left, top, rx: width / 2, ry: height / 2, fill: fillColor.value, stroke, strokeWidth, strokeUniform: true });
};

// ===== Своё рисование =====
// Один активный жест: штрих, фигура, ластик или перемещение вида
let gesture = null;
let draftTimer = null;

const flushDraft = () => {
    draftTimer = null;
    if (!gesture) return;
    if (gesture.kind === 'stroke' && gesture.pending.length) {
        send('board:draft', {
            id: gesture.id,
            kind: 'stroke',
            style: gesture.styleSent ? undefined : gesture.style,
            points: gesture.pending
        });
        gesture.styleSent = true;
        gesture.pending = [];
    } else if (gesture.kind === 'shape' && gesture.temp) {
        send('board:draft', { id: gesture.id, kind: 'shape', json: { ...serialize(gesture.temp), id: gesture.id } });
    }
};

const scheduleDraft = () => {
    if (!draftTimer) draftTimer = setTimeout(flushDraft, DRAFT_INTERVAL);
};

const renderTemp = (obj) => {
    if (gesture.temp) canvas.remove(gesture.temp);
    gesture.temp = asDraft(obj);
    canvas.add(gesture.temp);
    canvas.requestRenderAll();
};

// Отменить незаконченный жест (второй палец, смена инструмента, чужая очистка)
const cancelGesture = () => {
    if (!gesture) return;
    if (gesture.temp) canvas.remove(gesture.temp);
    if (gesture.kind === 'stroke' || gesture.kind === 'shape') send('board:draft-end', gesture.id);
    if (gesture.kind === 'erase' && gesture.removed.length) finishErase();
    clearTimeout(draftTimer);
    draftTimer = null;
    gesture = null;
    panning.value = false;
    canvas.requestRenderAll();
};

const onMouseDown = (opt) => {
    if (!canvas || twoFinger) return;
    closePanels();
    const e = opt.e;
    const p = opt.scenePoint;
    const middle = e && e.button === 1;

    if (readOnly.value || tool.value === 'move' || spacePressed.value || middle) {
        const v = opt.viewportPoint;
        gesture = { kind: 'pan', last: { x: v.x, y: v.y } };
        panning.value = true;
        return;
    }

    if (STROKE_TOOLS.includes(tool.value)) {
        const point = [round(p.x), round(p.y)];
        gesture = { kind: 'stroke', id: newId(), style: strokeStyle(), points: [point], pending: [point], temp: null, styleSent: false };
        renderTemp(makeStroke(gesture.points, gesture.style));
        scheduleDraft();
    } else if (SHAPE_TOOLS.includes(tool.value)) {
        gesture = { kind: 'shape', id: newId(), tool: tool.value, start: { x: round(p.x), y: round(p.y) }, temp: null };
    } else if (tool.value === 'eraser') {
        gesture = { kind: 'erase', removed: [], last: opt.viewportPoint };
        eraseAt(opt.viewportPoint, opt.scenePoint);
    } else if (tool.value === 'text') {
        gesture = { kind: 'text', start: opt.viewportPoint, target: opt.target };
    }
};

const onMouseMove = (opt) => {
    if (!gesture) return;
    const p = opt.scenePoint;

    if (gesture.kind === 'pan') {
        const v = opt.viewportPoint;
        panBy(v.x - gesture.last.x, v.y - gesture.last.y);
        gesture.last = { x: v.x, y: v.y };
    } else if (gesture.kind === 'stroke') {
        const point = [round(p.x), round(p.y)];
        const last = gesture.points[gesture.points.length - 1];
        // Точки ближе 1.5 px экрана не добавляем — меньше данных
        if (Math.hypot(point[0] - last[0], point[1] - last[1]) * scale.value < 1.5) return;
        gesture.points.push(point);
        gesture.pending.push(point);
        renderTemp(makeStroke(gesture.points, gesture.style));
        scheduleDraft();
    } else if (gesture.kind === 'shape') {
        renderTemp(makeShape(gesture.tool, gesture.start, { x: round(p.x), y: round(p.y) }));
        scheduleDraft();
    } else if (gesture.kind === 'erase') {
        // Между событиями проверяем промежуточные точки: быстрый жест не «перепрыгнет» линию
        const from = gesture.last;
        const to = opt.viewportPoint;
        const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 6));
        for (let i = 1; i <= steps; i++) {
            const vx = from.x + ((to.x - from.x) * i) / steps;
            const vy = from.y + ((to.y - from.y) * i) / steps;
            eraseAt(new F.Point(vx, vy), new F.Point(vx, vy).transform(F.util.invertTransform(canvas.viewportTransform)));
        }
        gesture.last = to;
    }
};

const onMouseUp = (opt) => {
    if (!gesture) return;
    const g = gesture;
    gesture = null;
    clearTimeout(draftTimer);
    draftTimer = null;

    if (g.kind === 'pan') {
        panning.value = false;
        return;
    }

    if (g.kind === 'stroke' || g.kind === 'shape') {
        if (g.temp) canvas.remove(g.temp);
        let obj = null;
        if (g.kind === 'stroke') obj = makeStroke(g.points, g.style);
        else if (g.temp) obj = makeShape(g.tool, g.start, { x: round(opt.scenePoint.x), y: round(opt.scenePoint.y) });

        if (obj) {
            obj.id = g.id;
            addObject(obj);
            const json = serialize(obj);
            remember([json]);
            send('board:add', [json]);
            pushHistory({ type: 'add', objs: [json] });
            refreshCounts();
            // Уже рисует — подсказка больше не нужна
            dismissHint();
        }
        send('board:draft-end', g.id);
        canvas.requestRenderAll();
    } else if (g.kind === 'erase') {
        gesture = g;
        finishErase();
        gesture = null;
    } else if (g.kind === 'text') {
        const moved = Math.hypot(opt.viewportPoint.x - g.start.x, opt.viewportPoint.y - g.start.y) > 6;
        if (!moved) startText(opt);
    }
};

// ===== Ластик: удаляет объекты, которых коснулся =====
const eraseAt = (viewportPoint, scenePoint) => {
    const radius = ERASER_TOLERANCE / scale.value;
    const objs = canvas.getObjects();
    for (let i = objs.length - 1; i >= 0; i--) {
        const obj = objs[i];
        if (obj.isDraft || obj.isEditing) continue;
        const r = obj.getBoundingRect();
        if (scenePoint.x < r.left - radius || scenePoint.x > r.left + r.width + radius ||
            scenePoint.y < r.top - radius || scenePoint.y > r.top + r.height + radius) continue;
        if (canvas.isTargetTransparent(obj, viewportPoint.x, viewportPoint.y)) continue;

        gesture.removed.push(serialize(obj));
        removeObject(obj.id);
    }
    canvas.requestRenderAll();
};

const finishErase = () => {
    const removed = gesture?.removed || [];
    if (!removed.length) return;
    send('board:remove', removed.map((o) => o.id));
    pushHistory({ type: 'remove', objs: removed });
    gesture.removed = [];
    refreshCounts();
};

// ===== Текст =====

const startText = (opt) => {
    // Нажали на существующий текст — редактируем его
    if (isText(opt.target)) {
        canvas.setActiveObject(opt.target);
        opt.target.enterEditing();
        return;
    }
    const text = new F.IText('', {
        left: round(opt.scenePoint.x),
        top: round(opt.scenePoint.y - fontSize.value / 2),
        fontSize: fontSize.value,
        fontFamily: 'Roboto',
        fill: lineColor.value === '#FFFFFF' ? '#0f172a' : lineColor.value
    });
    text.id = newId();
    text.isNew = true;
    addObject(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    canvas.requestRenderAll();
};

const onTextEditingExited = ({ target }) => {
    if (!target || !target.id) return;
    const empty = !target.text || !target.text.trim();

    if (target.isNew) {
        delete target.isNew;
        if (empty) {
            removeObject(target.id);
        } else {
            const json = serialize(target);
            remember([json]);
            send('board:add', [json]);
            pushHistory({ type: 'add', objs: [json] });
        }
    } else if (empty) {
        const before = lastJson.get(target.id) || serialize(target);
        removeObject(target.id);
        send('board:remove', [target.id]);
        pushHistory({ type: 'remove', objs: [before] });
    } else {
        const before = lastJson.get(target.id);
        const after = serialize(target);
        if (!before || JSON.stringify(before) !== JSON.stringify(after)) {
            remember([after]);
            send('board:update', [after]);
            if (before) pushHistory({ type: 'update', before: [before], after: [after] });
        }
    }
    refreshCounts();
    canvas.requestRenderAll();
};

// ===== Выделение: перемещение, масштаб, поворот, удаление =====
// У объектов внутри группового выделения координаты относительные —
// для сохранения временно снимаем выделение
const withAbsolute = (objs, fn) => {
    const active = canvas.getActiveObject();
    const grouped = active && active.type === 'activeselection';
    if (grouped) canvas.discardActiveObject();
    const result = fn();
    if (grouped) {
        const sel = new F.ActiveSelection(objs, { canvas });
        canvas.setActiveObject(sel);
    }
    return result;
};

const onObjectModified = ({ target }) => {
    if (!target) return;
    const objs = (target.type === 'activeselection' ? target.getObjects() : [target]).filter((o) => o.id && !o.isDraft);
    if (!objs.length) return;
    const after = withAbsolute(objs, () => objs.map(serialize));
    const before = objs.map((o) => lastJson.get(o.id)).filter(Boolean);
    remember(after);
    send('board:update', after);
    if (before.length === after.length) pushHistory({ type: 'update', before, after });
    canvas.requestRenderAll();
};

const deleteSelection = () => {
    const objs = canvas.getActiveObjects().filter((o) => o.id && !o.isDraft && !o.isEditing);
    if (!objs.length) return;
    const jsons = withAbsolute(objs, () => objs.map(serialize));
    canvas.discardActiveObject();
    objs.forEach((o) => removeObject(o.id));
    send('board:remove', objs.map((o) => o.id));
    pushHistory({ type: 'remove', objs: jsons });
    refreshCounts();
    canvas.requestRenderAll();
};

// На задний план: например, картинку под рисунки. Порядок слоёв — у всех
const sendSelectionToBack = () => {
    const objs = canvas.getActiveObjects().filter((o) => o.id && !o.isDraft);
    if (!objs.length) return;
    // Сохраняем взаимный порядок выделенных: самый нижний отправляем последним
    const ordered = [...objs].sort((a, b) => canvas.getObjects().indexOf(a) - canvas.getObjects().indexOf(b));
    withAbsolute(objs, () => [...ordered].reverse().forEach((o) => canvas.sendObjectToBack(o)));
    send('board:to-back', ordered.map((o) => o.id));
    canvas.requestRenderAll();
};

const applyToBack = (ids) => {
    const objs = ids.map((id) => byId.get(id)).filter(Boolean);
    [...objs].reverse().forEach((o) => canvas.sendObjectToBack(o));
    canvas.requestRenderAll();
};

// ===== Картинка из материалов урока =====
// Кладём в центр видимой области, не больше ~60% экрана, и сразу выделяем —
// можно подвинуть и изменить размер. crossOrigin — чтобы доска с картинкой
// сохранялась в PNG (сервер отдаёт файлы с CORS)
const insertImage = async (material) => {
    imagesOpen.value = false;
    if (!canvas || imageLoading.value) return;
    imageLoading.value = true;

    try {
        const url = mediaUrl(material.target);
        // Без CORS-заголовка картинка с crossOrigin не загрузится — тогда
        // берём без него: на доске видна, только сохранение в PNG не сработает
        const img = await F.FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
            .catch(() => F.FabricImage.fromURL(url));
        const zoom = scale.value;
        const w = canvas.getWidth();
        const h = canvas.getHeight();
        const fit = Math.min(1, (0.6 * w) / (img.width * zoom), (0.6 * h) / (img.height * zoom));
        const center = new F.Point(w / 2, h / 2).transform(F.util.invertTransform(canvas.viewportTransform));

        img.set({
            scaleX: fit,
            scaleY: fit,
            left: round(center.x - (img.width * fit) / 2),
            top: round(center.y - (img.height * fit) / 2)
        });
        img.id = newId();

        tool.value = 'select'; // сразу можно двигать и менять размер
        addObject(img);
        const json = serialize(img);
        remember([json]);
        send('board:add', [json]);
        pushHistory({ type: 'add', objs: [json] });
        refreshCounts();
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
    } catch (e) {
        notify('warning', t('board.image_failed'));
    } finally {
        imageLoading.value = false;
    }
};

const updateSelectionState = () => {
    hasSelection.value = canvas.getActiveObjects().length > 0 && tool.value === 'select';
};

// ===== Режимы =====
const applyMode = () => {
    if (!canvas) return;
    cancelGesture();
    const select = tool.value === 'select';
    canvas.selection = select;
    canvas.skipTargetFind = !(select || tool.value === 'text');
    if (!select) {
        const active = canvas.getActiveObject();
        if (!(tool.value === 'text' && isText(active) && active.isEditing)) canvas.discardActiveObject();
    }
    canvas.getObjects().forEach(applyInteractivity);
    updateCursor();
    updateSelectionState();
    canvas.requestRenderAll();
};

const updateCursor = () => {
    if (!canvas) return;
    let cursor = 'crosshair';
    if (panning.value) cursor = 'grabbing';
    else if (spacePressed.value || tool.value === 'move') cursor = 'grab';
    else if (tool.value === 'select') cursor = 'default';
    else if (tool.value === 'text') cursor = 'text';
    else if (tool.value === 'eraser') {
        const size = ERASER_TOLERANCE * 2;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="white" fill-opacity="0.6" stroke="#64748b"/></svg>`;
        cursor = `url("data:image/svg+xml;base64,${btoa(svg)}") ${size / 2} ${size / 2}, crosshair`;
    }
    canvas.defaultCursor = cursor;
    canvas.hoverCursor = tool.value === 'select' ? 'move' : cursor;
    canvas.setCursor(cursor);
};

watch(tool, applyMode);

watch(readOnly, (ro) => {
    if (!canvas) return;
    if (!ro) {
        // Разрешили рисовать — сразу карандаш, как при открытии доски
        if (tool.value === 'move') tool.value = 'pencil';
        return;
    }
    cancelGesture();
    closePanels();
    const active = canvas.getActiveObject();
    if (isText(active) && active.isEditing) active.exitEditing();
    canvas.discardActiveObject();
    tool.value = 'move';
    applyMode();
});

// Роль могла определиться позже (данные конференции пришли после доски)
watch(() => props.canManage, () => sendRole());
watch([panning, spacePressed], updateCursor);

// ===== Очистка и экспорт =====
const confirmClear = async () => {
    const ok = await confirm({
        title: t('board.clear_title'),
        message: t('board.clear_confirm'),
        confirmText: t('board.actions.clear'),
        danger: true
    });
    if (!ok) return;
    const before = realObjects().map(serialize);
    applyClear();
    send('board:clear');
    if (before.length) pushHistory({ type: 'clear', objs: before });
};

// PNG всего нарисованного на белом фоне
const saveAsImage = async () => {
    const box = contentBounds();
    const pad = 32;
    const width = Math.ceil(box ? box.width + pad * 2 : 800);
    const height = Math.ceil(box ? box.height + pad * 2 : 600);

    const out = new F.StaticCanvas(document.createElement('canvas'), { width, height, backgroundColor: '#ffffff' });
    const objs = await F.util.enlivenObjects(realObjects().map(serialize));
    objs.forEach((o) => out.add(o));
    if (box) out.setViewportTransform([1, 0, 0, 1, pad - box.left, pad - box.top]);
    out.renderAll();

    try {
        const link = document.createElement('a');
        link.href = out.toDataURL({ format: 'png', multiplier: 1 });
        link.download = 'board-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.png';
        link.click();
        link.remove();
    } catch (e) {
        // Картинка с другого домена без CORS — браузер не даёт выгрузить холст
        notify('warning', t('board.export_failed'));
    } finally {
        out.dispose();
    }
};

// ===== Загрузка доски с сервера =====
// Сервер отвечает пустой доской, пока сокет не вошёл в комнату, —
// тогда пробуем ещё раз чуть позже
let loadAttempts = 0;
let loadTimer = null;

const loadBoard = () => {
    clearTimeout(loadTimer);
    sendRole();
    $socketPlugin.emit('board:get', async (res) => {
        if (!canvas) return;
        if (!res || res.joined === false) {
            if (loadAttempts++ < 10) loadTimer = setTimeout(loadBoard, 1500);
            else loading.value = false;
            return;
        }
        loadAttempts = 0;
        learnersCanEdit.value = Boolean(res.learnersCanEdit);
        const objs = res.objects || [];
        await enqueue(async () => {
            applyClear();
            lastJson.clear();
            if (objs.length) {
                await applyAdd(objs);
                remember(objs);
                fitToContent();
            }
        });
        loading.value = false;
    });
};

// ===== Сокет: события других участников (по очереди) =====
const socketHandlers = {
    'board:add': (list) => enqueue(() => { remember(list); return applyAdd(list); }),
    'board:update': (list) => enqueue(() => { remember(list); return applyUpdate(list); }),
    'board:remove': (ids) => enqueue(() => applyRemove(ids)),
    'board:clear': () => enqueue(() => { cancelGesture(); applyClear(); }),
    'board:draft': (data) => enqueue(() => onRemoteDraft(data)),
    'board:draft-end': (id) => enqueue(() => removeDraft(id)),
    'board:to-back': (ids) => enqueue(() => applyToBack(ids)),
    // Учитель разрешил / запретил ученикам рисовать
    'board:access': (data) => {
        const value = Boolean(data?.learnersCanEdit);
        if (value === learnersCanEdit.value) return;
        learnersCanEdit.value = value;
        if (props.canManage) return;
        notify(value ? 'success' : 'warning', value ? t('board.access.notify_open') : t('board.access.notify_locked'));
        // Правку, которую сервер мог уже не принять, сверяем с общей доской
        if (!value) loadBoard();
    },
    // Переподключились — доска могла измениться
    connect: () => loadBoard()
};

// ===== Клавиатура =====
const isTypingTarget = (el) =>
    el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);

const handleKeyDown = (event) => {
    if (!props.active || !canvas || isTypingTarget(event.target)) return;
    const key = event.key.toLowerCase();
    const mod = event.ctrlKey || event.metaKey;

    if (readOnly.value && (mod || key === 'delete' || key === 'backspace')) return;

    if (mod && key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
    } else if (mod && (key === 'y' || (key === 'z' && event.shiftKey))) {
        event.preventDefault();
        redo();
    } else if ((key === 'delete' || key === 'backspace') && tool.value === 'select') {
        event.preventDefault();
        deleteSelection();
    } else if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        spacePressed.value = true;
    } else if (key === 'escape') {
        if (panelOpen.value || groupPanel.value || moreOpen.value || imagesOpen.value) {
            closePanels();
        } else {
            canvas.discardActiveObject();
            canvas.requestRenderAll();
        }
    }
};

const handleKeyUp = (event) => {
    if (event.code === 'Space') spacePressed.value = false;
};

// Клик вне панелей — закрыть их
const handlePointerDown = (event) => {
    const inDock = dock.value?.contains(event.target);
    const inActions = actionsBar.value?.contains(event.target);
    if ((panelOpen.value || groupPanel.value) && !inDock) {
        panelOpen.value = false;
        groupPanel.value = null;
    }
    if ((moreOpen.value || imagesOpen.value) && !inActions) {
        moreOpen.value = false;
        imagesOpen.value = false;
    }
};

// ===== Подсказка по жестам =====
const dismissHint = () => {
    if (!showHint.value) return;
    showHint.value = false;
    try { localStorage.setItem(HINT_KEY, '1'); } catch (e) { /* приватный режим */ }
};

watch(() => props.active, (active) => {
    if (!canvas) return;
    if (!active) {
        spacePressed.value = false;
        closePanels();
        cancelGesture();
        const activeObj = canvas.getActiveObject();
        if (isText(activeObj) && activeObj.isEditing) activeObj.exitEditing();
    } else {
        // Окно открылось — размер мог измениться
        resize();
    }
});

const resize = () => {
    if (!canvas || !stage.value) return;
    const { clientWidth, clientHeight } = stage.value;
    if (!clientWidth || !clientHeight) return;
    canvas.setDimensions({ width: clientWidth, height: clientHeight });
    canvas.requestRenderAll();
};

// ===== Два пальца: перемещение и масштаб =====
let twoFinger = false;

const setupGestures = () => {
    hammer = new $hammer.Manager(stage.value, { touchAction: 'none' });
    const twoPan = new $hammer.Pan({ event: 'twopan', pointers: 2, threshold: 0, direction: $hammer.DIRECTION_ALL });
    const pinch = new $hammer.Pinch();
    twoPan.recognizeWith(pinch);
    hammer.add([twoPan, pinch]);

    let lastCenter = null;
    let startZoom = 1;
    const local = (c) => {
        const rect = stage.value.getBoundingClientRect();
        return new F.Point(c.x - rect.left, c.y - rect.top);
    };

    hammer.on('twopanstart pinchstart', (e) => {
        twoFinger = true;
        cancelGesture(); // второй палец — это жест, а не рисование
        lastCenter = local(e.center);
        startZoom = scale.value;
        dismissHint();
    });
    hammer.on('twopanmove', (e) => {
        if (!lastCenter) return;
        const c = local(e.center);
        panBy(c.x - lastCenter.x, c.y - lastCenter.y);
        lastCenter = c;
    });
    hammer.on('pinchmove', (e) => zoomTo(startZoom * e.scale, local(e.center)));
    hammer.on('twopanend twopancancel pinchend pinchcancel', () => {
        lastCenter = null;
        twoFinger = false;
    });
};

onMounted(async () => {
    try {
        // Сенсорный экран: не только pointer: coarse (не срабатывает в эмуляторе
        // и на части телефонов), но и наличие касаний
        isTouch.value =
            window.matchMedia('(pointer: coarse)').matches ||
            navigator.maxTouchPoints > 0 ||
            'ontouchstart' in window;
        showHint.value = localStorage.getItem(HINT_KEY) !== '1';
    } catch (e) {
        showHint.value = true;
    }

    // Fabric.js — только в браузере и только здесь (~90 КБ)
    F = await import('fabric');
    if (!canvasEl.value) return;

    F.FabricObject.customProperties = ['id'];

    canvas = new F.Canvas(canvasEl.value, {
        width: stage.value.clientWidth || 800,
        height: stage.value.clientHeight || 600,
        selection: false,
        preserveObjectStacking: true,
        fireMiddleClick: true,
        stopContextMenu: true,
        enableRetinaScaling: true
    });
    canvas.setTargetFindTolerance(ERASER_TOLERANCE);

    canvas.on('mouse:down', onMouseDown);
    canvas.on('mouse:move', onMouseMove);
    canvas.on('mouse:up', onMouseUp);
    canvas.on('object:modified', onObjectModified);
    canvas.on('text:editing:exited', onTextEditingExited);
    canvas.on('text:editing:entered', ({ target }) => {
        if (target?.id && !target.isNew && !lastJson.has(target.id)) remember([serialize(target)]);
    });
    canvas.on('selection:created', updateSelectionState);
    canvas.on('selection:updated', updateSelectionState);
    canvas.on('selection:cleared', updateSelectionState);

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage.value);

    setupGestures();
    // Ученик без права рисовать — сразу «перемещение» (курсор-рука)
    if (readOnly.value) tool.value = 'move';
    applyMode();
    syncViewport();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('pointerdown', handlePointerDown);
    Object.entries(socketHandlers).forEach(([event, handler]) => $socketPlugin.on(event, handler));

    loadBoard();
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    document.removeEventListener('pointerdown', handlePointerDown);
    Object.entries(socketHandlers).forEach(([event, handler]) => $socketPlugin.off(event, handler));
    clearTimeout(loadTimer);
    clearTimeout(draftTimer);
    drafts.forEach((d) => clearTimeout(d.timer));
    resizeObserver?.disconnect();
    hammer?.destroy();
    canvas?.dispose();
    canvas = null;
});
</script>
