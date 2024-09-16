<template>
    <div ref="container" class="canvas-container card">
        <canvas ref="canvas"></canvas>
        <input ref="textInput" type="text" class="absolute hidden leading-none min-w-20 max-w-40">
        <div class="controls flex flex-col">

            <div class="flex gap-1 w-fit">
                <button v-for="item in actions" :key="item.action_name" class='btn btn-square btn-sm btn-light'
                    :title="$t('board.actions.' + item.action_name)" @click="item.action">
                    <i :class="item.action_icon"></i>
                </button>
            </div>

            <div class="flex flex-col gap-1 w-fit justify-center">
                <div v-for="item in tools" :key="item.tool_name" class="flex gap-1 tool">
                    <button class='btn btn-square btn-sm' :title="$t('board.tools.' + item.tool_name)"
                        :class="tool.tool_name === item.tool_name ? 'btn-outline-primary' : 'btn-light'"
                        @click="selectTool(item)">
                        <i :class="item.tool_icon"></i>
                    </button>
                    <button v-if="tool.tool_name === item.tool_name" @click="toolModalIsVisible = true;"
                        class='btn btn-square btn-sm btn-light tool-params' :title="$t('board.show_tool_parameters')">
                        <i class="bi bi-gear"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <modal :show="toolModalIsVisible" :onClose="() => toolModalIsVisible = false" :class="'modal-sm'">
        <template v-slot:header_content>
            <h4>{{ $t('board.tool_parameters') }}</h4>
        </template>
        <template v-slot:body_content>
            <div class="flex flex-col gap-y-4">
                <div v-if="tool.border_palette === true">
                    <p class="font-medium">{{ $t('board.params.border_color') }}</p>
                    <colorPicker :color="lineColor" :onSelect="(color) => lineColor = color" />
                </div>

                <div v-if="tool.fill_palette === true">
                    <p class="font-medium">{{ $t('board.params.fill_color') }}</p>
                    <colorPicker :color="fillColor" :onSelect="(color) => fillColor = color" />
                </div>

                <div v-if="tool.border === true">
                    <p class="font-medium">{{ $t('board.params.border_width') }}</p>
                    <lineWidthSelect :width="lineWidth" :color="lineColor" :tool_name="tool.tool_name"
                        :onSelect="(width) => lineWidth = width" />
                </div>

                <div v-if="tool.text_params === true">
                    <p class="font-medium">{{ $t('board.params.text_params') }}</p>
                    <fontSelect :size="fontSize" :onSelect="(size) => fontSize = size" />
                </div>
            </div>
        </template>
    </modal>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, watch } from 'vue';
import LZString from 'lz-string';
import modal from '../ui/modal.vue';
import colorPicker from './board/colorPicker.vue';
import lineWidthSelect from './board/lineWidthSelect.vue';
import fontSelect from './board/fontSelect.vue';
import { widths } from '../../utils/widths';
import { fontSizes } from '../../utils/fontSizes';

const props = defineProps({
    streams_length: {
        type: Number,
        required: true
    }
});

const { $socketPlugin, $hammer } = useNuxtApp();

const canvas = ref(null);
const context = ref(null);
const container = ref(null);

const drawing = ref(false);
const iCanDraw = ref(true);

const fillColor = ref('#FFFFFF00'); // Цвет заливки по умолчанию
const lineColor = ref('#000000'); // Цвет границы по умолчанию

const lineWidth = ref(widths[0]);

const startPos = reactive({ x: 0, y: 0 });

const textInput = ref(null);
const lastTextPos = reactive({ x: 0, y: 0 });
const fontSize = ref(fontSizes[0]);

const history = ref([]);
const undoneHistory = ref([]);

const cursorSVG = ref(''); // SVG для курсора

const tools = [
    {
        tool_name: 'pencil',
        tool_icon: 'bi bi-pencil',
        border_palette: true,
        fill_palette: false,
        border: false
    },
    {
        tool_name: 'brush',
        tool_icon: 'bi bi-brush',
        border_palette: true,
        fill_palette: false,
        border: true,
        text_params: false
    },
    {
        tool_name: 'line',
        tool_icon: 'bi bi-slash-lg',
        border_palette: true,
        fill_palette: false,
        border: true,
        text_params: false
    },
    {
        tool_name: 'rectangle',
        tool_icon: 'bi bi-square',
        border_palette: true,
        fill_palette: true,
        border: true,
        text_params: false
    },
    {
        tool_name: 'circle',
        tool_icon: 'bi bi-circle',
        border_palette: true,
        fill_palette: true,
        border: true,
        text_params: false
    },
    {
        tool_name: 'text',
        tool_icon: 'bi bi-type',
        border_palette: true,
        fill_palette: false,
        border: false,
        text_params: true
    },
    {
        tool_name: 'eraser',
        tool_icon: 'bi bi-eraser-fill',
        border_palette: false,
        fill_palette: false,
        border: true,
        text_params: false
    }
];

const tool = ref(tools[0]); // Инструмент по умолчанию

const toolModalIsVisible = ref(false);

const actions = [
    {
        action_name: 'undo',
        action_icon: 'bi bi-arrow-counterclockwise',
        action: () => undo(true)
    },
    {
        action_name: 'redo',
        action_icon: 'bi bi-arrow-clockwise',
        action: () => redo(true)
    },
    {
        action_name: 'clear',
        action_icon: 'bi bi-trash',
        action: () => clearCanvas(true)
    },
    {
        action_name: 'save',
        action_icon: 'bi bi-save',
        action: () => saveAsImage()
    }
];

const selectTool = (selectedTool) => {
    tool.value = selectedTool;

    if (tool.value.tool_name === 'eraser') {
        lineWidth.value = widths[widths.length - 1];
    }
};

const updateCursorSVG = () => {
    let cursorSize = lineWidth.value;

    if (iCanDraw.value === true) {
        if (tool.value.tool_name === 'eraser') {
            cursorSize *= 2;  // Увеличиваем размер для ластика
            cursorSVG.value = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" fill="currentColor" class="bi bi-eraser-fill" viewBox="0 0 16 16">
        <path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828zm.66 11.34L3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293z"/>
    </svg>`;
        } else if (tool.value.tool_name === 'pencil') {
            cursorSize = 16;  // Размер курсора для карандаша
            cursorSVG.value = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" fill="${(lineColor.value === '#FFFFFF' || lineColor.value === '#FFFFFF00') ? 'currentColor' : lineColor.value}" class="bi bi-pencil" viewBox="0 0 16 16">
         <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
    </svg>`;
        } else if (tool.value.tool_name === 'text') {
            cursorSize = fontSize.value;  // Размер курсора для текста
            cursorSVG.value = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" fill="${(lineColor.value === '#FFFFFF' || lineColor.value === '#FFFFFF00') ? 'currentColor' : lineColor.value}" class="bi bi-cursor-text" viewBox="0 0 16 16">
        <path d="M5 2a.5.5 0 0 1 .5-.5c.862 0 1.573.287 2.06.566.174.099.321.198.44.286.119-.088.266-.187.44-.286A4.17 4.17 0 0 1 10.5 1.5a.5.5 0 0 1 0 1c-.638 0-1.177.213-1.564.434a3.5 3.5 0 0 0-.436.294V7.5H9a.5.5 0 0 1 0 1h-.5v4.272c.1.08.248.187.436.294.387.221.926.434 1.564.434a.5.5 0 0 1 0 1 4.17 4.17 0 0 1-2.06-.566A5 5 0 0 1 8 13.65a5 5 0 0 1-.44.285 4.17 4.17 0 0 1-2.06.566.5.5 0 0 1 0-1c.638 0 1.177-.213 1.564-.434.188-.107.335-.214.436-.294V8.5H7a.5.5 0 0 1 0-1h.5V3.228a3.5 3.5 0 0 0-.436-.294A3.17 3.17 0 0 0 5.5 2.5.5.5 0 0 1 5 2m2.648 10.645"/>
    </svg>`;
        } else if (tool.value.tool_name === 'rectangle' || tool.value.tool_name === 'circle') {
            cursorSize = 16 + lineWidth.value;
            cursorSVG.value = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" fill="${(fillColor.value === '#FFFFFF' || fillColor.value === '#FFFFFF00') ? 'currentColor' : fillColor.value}" class="bi bi-plus-lg" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
    </svg>`;
        } else if (tool.value.tool_name === 'line') {
            cursorSize = 16 + lineWidth.value;
            cursorSVG.value = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" fill="${(lineColor.value === '#FFFFFF' || lineColor.value === '#FFFFFF00') ? 'currentColor' : lineColor.value}" class="bi bi-plus-lg" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
    </svg>`;
        } else {
            cursorSize = lineWidth.value;
            cursorSVG.value = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" fill="${(lineColor.value === '#FFFFFF' || lineColor.value === '#FFFFFF00') ? 'currentColor' : lineColor.value}" class="bi bi-circle-fill" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="8" stroke="#000" />
    </svg>`;
        }
    }
    else {
        cursorSize = 16;
        cursorSVG.value = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" fill="red" class="bi bi-ban" viewBox="0 0 16 16">
            <path d="M15 8a6.97 6.97 0 0 0-1.71-4.584l-9.874 9.875A7 7 0 0 0 15 8M2.71 12.584l9.874-9.875a7 7 0 0 0-9.874 9.874ZM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0"/>
        </svg>`;
    }

    // Применяем смещение курсора на половину его размеров
    if (canvas.value) {
        if (tool.value.tool_name === 'pencil') {
            canvas.value.style.cursor = `url("data:image/svg+xml;base64,${btoa(cursorSVG.value)}") 0 16, auto`;
        }
        else {
            canvas.value.style.cursor = `url("data:image/svg+xml;base64,${btoa(cursorSVG.value)}") ${cursorSize / 2} ${cursorSize / 2}, auto`;
        }
    }
};

watch([tool, fillColor, lineColor, lineWidth, fontSize, iCanDraw], updateCursorSVG, { immediate: true });

const resizeCanvas = () => {
    if (container.value) {
        const { width, height } = container.value.getBoundingClientRect();
        const imageData = context.value.getImageData(0, 0, canvas.value.width, canvas.value.height);
        canvas.value.width = width;
        canvas.value.height = height;
        context.value.putImageData(imageData, 0, 0);
    }
};

onMounted(() => {

    const hammer = new $hammer(canvas.value);
    context.value = canvas.value.getContext('2d', { willReadFrequently: true });
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', handleKeyDown);

    updateCursorSVG();

    // Настройка жестов для рисования
    hammer.get('pan').set({ direction: $hammer.DIRECTION_ALL, threshold: 0 });

    hammer.on('panstart', (e) => {
        startDrawing(e.center.x, e.center.y, true)
    });

    hammer.on('panmove', (e) => {
        draw(e.center.x, e.center.y, true);
    });

    hammer.on('panend', () => {
        stopDrawing(true);
    });

    hammer.on('tap', (e) => {
        if (tool.value.tool_name === 'text') {
            if (textInput.value.style.display === 'block' && textInput.value.value != '') {
                insertText(textInput.value.value, fontSize.value, lineColor.value, lastTextPos.value, true);
                textInput.value.value = '';
                textInput.value.style.display = 'none';
            }
            else {
                lastTextPos.value = { x: e.center.x, y: e.center.y };
                const rect = canvas.value.getBoundingClientRect();

                textInput.value.style.left = (e.center.x - rect.left) + 'px';
                textInput.value.style.top = ((e.center.y - rect.top) - fontSize.value) + 'px';
                textInput.value.style.display = 'block';
                textInput.value.style.fontSize = fontSize.value + 'px';
                textInput.value.style.color = lineColor.value;

                if (lineColor.value === '#FFFFFF') {
                    textInput.value.classList.add('text-stroke');
                }
                else{
                    textInput.value.classList.remove('text-stroke');
                }
                textInput.value.focus();
            }
        }
    });

    $socketPlugin.on('startDrawing', (compressedData) => {
        const data = JSON.parse(LZString.decompress(compressedData));

        tool.value = data.tool;
        fillColor.value = data.fillColor;
        lineColor.value = data.lineColor;
        lineWidth.value = data.lineWidth;

        // Отключение 'pan' временно
        hammer.get('pan').set({ enable: false });
        iCanDraw.value = false;
        startDrawing(data.currentPos.x, data.currentPos.y, false);
    });

    $socketPlugin.on('drawing', (compressedData) => {
        const data = JSON.parse(LZString.decompress(compressedData));
        draw(data.currentPos.x, data.currentPos.y, false);
    });

    $socketPlugin.on('stopDrawing', () => {
        // Включение 'pan'
        hammer.get('pan').set({ enable: true });
        iCanDraw.value = true;
        stopDrawing(false);
    });

    $socketPlugin.on('insertText', (compressedData) => {
        const data = JSON.parse(LZString.decompress(compressedData));
        insertText(data.text, data.size, data.color, data.position, false);
    });

    $socketPlugin.on('undoDrawing', () => {
        undo(false);
    });

    $socketPlugin.on('redoDrawing', () => {
        redo(false);
    });

    $socketPlugin.on('clearDrawing', () => {
        clearCanvas(false);
    });
});

onUnmounted(() => {
    window.removeEventListener('resize', resizeCanvas);
    window.removeEventListener('keydown', handleKeyDown);
});

const handleKeyDown = (event) => {
    if (event.ctrlKey && event.key === 'z') {
        undo(); // Вызываем функцию undo при Ctrl+Z
        event.preventDefault();
    }
    if (event.ctrlKey && event.key === 'y') {
        redo(); // Вызываем функцию redo при Ctrl+Y
        event.preventDefault();
    }
};

const saveState = () => {
    if (history.value.length >= 5) {
        history.value.shift();
    }
    history.value.push(context.value.getImageData(0, 0, canvas.value.width, canvas.value.height));
    undoneHistory.value = [];
};

const startDrawing = (clientX, clientY, local) => {
    drawing.value = true;
    const rect = canvas.value.getBoundingClientRect();
    startPos.x = (local === true ? (clientX - rect.left) : clientX);
    startPos.y = (local === true ? (clientY - rect.top) : clientY);

    if (local === true && props.streams_length > 1) {
        //Отправляем событие начала рисования
        const drawingData = {
            tool: tool.value,
            currentPos: { x: startPos.x, y: startPos.y },
            fillColor: fillColor.value,
            lineColor: lineColor.value,
            lineWidth: lineWidth.value
        };

        const compressedData = LZString.compress(JSON.stringify(drawingData));

        $socketPlugin.emit('startDrawing', compressedData);
    }
};

const draw = (clientX, clientY, local) => {
    if (!drawing.value) return;

    const tool_name = tool.value.tool_name;
    const rect = canvas.value.getBoundingClientRect();
    const currentX = (local === true ? (clientX - rect.left) : clientX);
    const currentY = (local === true ? (clientY - rect.top) : clientY);

    context.value.lineWidth = tool_name === 'pencil' ? widths[0] : lineWidth.value;
    context.value.lineCap = 'round';
    context.value.strokeStyle = lineColor.value;

    if (tool_name === 'pencil' || tool_name === 'brush' || tool_name === 'eraser') {

        if (tool_name === 'eraser') {
            context.value.globalCompositeOperation = 'destination-out';
        }

        context.value.lineTo(currentX, currentY);
        context.value.stroke();
        context.value.beginPath();
        context.value.moveTo(currentX, currentY);

        if (tool_name === 'eraser') {
            context.value.globalCompositeOperation = 'source-over';
        }
    }
    else {
        context.value.clearRect(0, 0, canvas.value.width, canvas.value.height);

        if (history.value.length > 0) {
            context.value.putImageData(history.value[history.value.length - 1], 0, 0);
        }

        context.value.beginPath();

        if (tool_name === 'line') {

            context.value.moveTo(startPos.x, startPos.y);
            context.value.lineTo(currentX, currentY);
            context.value.stroke();

        } else if (tool_name === 'rectangle') {

            context.value.fillStyle = fillColor.value;
            context.value.fillRect(startPos.x, startPos.y, currentX - startPos.x, currentY - startPos.y);

            context.value.strokeStyle = lineColor.value;
            context.value.strokeRect(startPos.x, startPos.y, currentX - startPos.x, currentY - startPos.y);

        } else if (tool_name === 'circle') {

            const width = currentX - startPos.x;
            const height = currentY - startPos.y;
            const radiusX = Math.abs(width / 2);
            const radiusY = radiusX;
            const centerX = startPos.x + width / 2;
            const centerY = startPos.y + height / 2;

            context.value.fillStyle = fillColor.value;
            context.value.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
            context.value.fill();
            context.value.strokeStyle = lineColor.value;
            context.value.stroke();

        }
    }

    if (local === true && props.streams_length > 1) {
        const drawingData = {
            currentPos: { x: currentX, y: currentY }
        };

        // Сжимаем данные перед отправкой
        const compressedData = LZString.compress(JSON.stringify(drawingData));
        $socketPlugin.emit('drawing', compressedData);
    }
};

const stopDrawing = (local) => {
    if (!drawing.value) return;
    drawing.value = false;

    saveState();

    context.value.beginPath();

    if (local === true && props.streams_length > 1) {
        $socketPlugin.emit('stopDrawing');
    }
};

const insertText = (text, size, color, position, local) => {
    const rect = canvas.value.getBoundingClientRect();
    const currentX = (local === true ? (position.x - rect.left) : position.x);
    const currentY = (local === true ? (position.y - rect.top) : position.y);

    context.value.font = size + 'px Roboto';
    context.value.fillStyle = color;
    context.value.textAlign = 'left';

    if (color === '#FFFFFF') {
        context.value.strokeText(text, currentX, currentY);
        context.value.strokeStyle = 'black';
    }
    else {
        context.value.fillText(text, currentX, currentY);
    }

    saveState();
    context.value.beginPath();

    if (local === true && props.streams_length > 1) {
        const textData = {
            text, size, color, position: { x: currentX, y: currentY }
        };

        const compressedData = LZString.compress(JSON.stringify(textData));
        $socketPlugin.emit('insertText', compressedData);
    }
}

const undo = (local) => {
    if (history.value.length > 0) {
        undoneHistory.value.push(history.value.pop());
        if (history.value.length > 0) {
            context.value.putImageData(history.value[history.value.length - 1], 0, 0);
        } else {
            context.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
        }

        if (local === true && props.streams_length > 1) {
            $socketPlugin.emit('undoDrawing');
        }
    }
};

const redo = (local) => {
    if (undoneHistory.value.length > 0) {
        const lastUndoneState = undoneHistory.value.pop();
        history.value.push(lastUndoneState);
        context.value.putImageData(lastUndoneState, 0, 0);

        if (local === true && props.streams_length > 1) {
            $socketPlugin.emit('redoDrawing');
        }
    }
};

const clearCanvas = (local) => {
    context.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
    saveState();

    if (local === true && props.streams_length > 1) {
        $socketPlugin.emit('clearDrawing');
    }
};

const saveAsImage = () => {
    const link = document.createElement('a');
    link.href = canvas.value.toDataURL('image/png'); // Получаем данные canvas в формате PNG
    link.download = 'canvas-image.png'; // Устанавливаем имя файла
    link.click(); // Инициируем скачивание
    link.remove(); // Удаляем элемент после скачивания
};
</script>

<style scoped>
.canvas-container {
    width: 100%;
    height: 75vh;
    position: relative;
    margin-bottom: 80px;
    overflow: scroll;
}

canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: crosshair;
}

.controls {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0px;
    top: 0px;
    padding: 10px;
    pointer-events: none;
    gap: 24px;
    display: flex;
    flex-direction: column;
}

.controls>div {
    pointer-events: auto;
}

.tool-params{
    display: none;
}

.tool:hover > .tool-params, .tool:focus > .tool-params{
    display: block;
}
</style>