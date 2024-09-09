<template>
    <div ref="container" class="canvas-container card">
        <canvas ref="canvas"></canvas>
        <div class="controls flex flex-col justify-between">

            <div class="flex gap-1 w-fit">
                <button @click="undo(true)" class="btn btn-light btn-square btn-sm">
                    <i class="bi bi-arrow-counterclockwise"></i>
                </button>
                <button @click="redo(true)" class="btn btn-light btn-square btn-sm">
                    <i class="bi bi-arrow-clockwise"></i>
                </button>
                <button @click="clearCanvas(true)" class="btn btn-light btn-square btn-sm">
                    <i class="bi bi-trash"></i>
                </button>
                <button @click="saveAsImage" class="btn btn-light btn-square btn-sm">
                    <i class="bi bi-save"></i>
                </button>
            </div>

            <div class="flex flex-col gap-1 w-fit justify-center">
                <button v-for="item in tools" :key="item.tool_name" class='btn btn-square btn-sm'
                    :class="tool.tool_name === item.tool_name ? 'btn-outline-primary' : 'btn-light'"
                    @click="selectTool(item)">
                    <i :class="item.tool_icon"></i>
                </button>
            </div>

            <div v-if="filteredShapeStylingTools.length > 1" class="flex flex-col gap-1 w-fit justify-center">
                <button v-for="item in filteredShapeStylingTools" :key="item.tool_name" class='btn btn-square btn-sm'
                    :class="shapeStylingTool.tool_name === item.tool_name ? 'btn-primary' : 'btn-light'"
                    @click="selectShapeStylingTool(item)">
                    <i :class="item.tool_icon"></i>
                </button>
            </div>

            <client-only>
                <Compact v-if="shapeStylingTool.tool_name === 'border_color' && tool.palette === true"
                    v-model="borderColor" />
                <Compact v-else-if="shapeStylingTool.tool_name === 'fill_color' && tool.palette_fill === true"
                    v-model="fillColor" />

                <div v-else-if="shapeStylingTool.tool_name === 'border_width' && tool.border === true"
                    class="card card-sm w-fit rounded-sm flex px-2 py-1">
                    <div v-for="width in widths" :key="width" @click="selectWidth(width)"
                        class="px-3 flex justify-center items-center h-8 rotate-45 hover:cursor-pointer">
                        <div class="h-full" :style="{ width: width + 'px' }"
                            :class="lineWidth === width ? 'bg-corp' : 'bg-active-inverse'"></div>
                    </div>
                </div>
            </client-only>

        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, computed, watch } from 'vue';
import { Compact } from '@ckpack/vue-color';
import LZString from 'lz-string';

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

const fillColor = ref({ hex: '#ffffff' }); // Цвет заливки по умолчанию
const borderColor = ref({ hex: '#000000' }); // Цвет границы по умолчанию

const widths = [2, 4, 6, 8, 10];
const lineWidth = ref(widths[0]);

const selectWidth = (width) => {
    lineWidth.value = width;
}

const startPos = reactive({ x: 0, y: 0 });

const history = ref([]);
const undoneHistory = ref([]);

const cursorSVG = ref(''); // SVG для курсора

const tools = [
    {
        tool_name: 'pencil',
        tool_icon: 'bi bi-pencil',
        palette: true,
        palette_fill: false,
        border: false
    },
    {
        tool_name: 'brush',
        tool_icon: 'bi bi-brush',
        palette: true,
        palette_fill: false,
        border: true
    },
    {
        tool_name: 'line',
        tool_icon: 'bi bi-slash-lg',
        palette: true,
        palette_fill: false,
        border: true
    },
    {
        tool_name: 'rectangle',
        tool_icon: 'bi bi-square',
        palette: true,
        palette_fill: true,
        border: true
    },
    {
        tool_name: 'circle',
        tool_icon: 'bi bi-circle',
        palette: true,
        palette_fill: true,
        border: true
    },
    {
        tool_name: 'eraser',
        tool_icon: 'bi bi-eraser-fill',
        palette: false,
        palette_fill: false,
        border: true
    }
];

const tool = ref(tools[0]); // Инструмент по умолчанию

const shapeStylingTools = [
    {
        tool_name: 'border_color',
        tool_icon: 'bi bi-palette',
        condition: () => tool.value.palette
    },
    {
        tool_name: 'fill_color',
        tool_icon: 'bi bi-palette-fill',
        condition: () => tool.value.palette_fill
    },
    {
        tool_name: 'border_width',
        tool_icon: 'bi bi-border-width',
        condition: () => tool.value.border
    }
];

const shapeStylingTool = ref(shapeStylingTools[0]);

const selectShapeStylingTool = (selectedTool) => {
    shapeStylingTool.value = selectedTool;
};

const filteredShapeStylingTools = computed(() => {
    return shapeStylingTools.filter((item) => item.condition());
});

const selectTool = (selectedTool) => {
    tool.value = selectedTool;

    if (tool.value.tool_name === 'eraser') {
        lineWidth.value = widths[widths.length - 1];
    }

    const findTool = tools.find((t) => t.tool_name === selectedTool.tool_name);
    if (findTool) {
        let stylingTool;
        if (findTool.palette === true) {
            stylingTool = shapeStylingTools.find((s) => s.tool_name === 'border_color');
            if (stylingTool) {
                shapeStylingTool.value = stylingTool;
                return;
            }
        }
        else if (findTool.palette_fill === true) {
            stylingTool = shapeStylingTools.find((s) => s.tool_name === 'fill_color');
            if (stylingTool) {
                shapeStylingTool.value = stylingTool;
                return;
            }
        }
        else if (findTool.border === true) {
            stylingTool = shapeStylingTools.find((s) => s.tool_name === 'border_width');
            if (stylingTool) {
                shapeStylingTool.value = stylingTool;
                return;
            }
        }
    }
};

const updateCursorSVG = () => {
    let cursorSize = lineWidth.value;

    if (tool.value.tool_name === 'eraser') {
        cursorSize *= 2;  // Увеличиваем размер для ластика
        cursorSVG.value = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" fill="currentColor" class="bi bi-eraser-fill" viewBox="0 0 16 16">
        <path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828zm.66 11.34L3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293z"/>
    </svg>`;
    } else if (tool.value.tool_name === 'pencil') {
        cursorSize = 16;  // Размер курсора для карандаша
        cursorSVG.value = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" fill="${borderColor.value.hex}" class="bi bi-pencil" viewBox="0 0 16 16">
         <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
    </svg>`;
    } else if (tool.value.tool_name === 'rectangle' || tool.value.tool_name === 'circle' || tool.value.tool_name === 'line') {
        cursorSize = lineWidth.value * 2;
        cursorSVG.value = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="${borderColor.value.hex}" class="bi bi-plus-lg" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
    </svg>`;
    } else {
        cursorSize = lineWidth.value;
        cursorSVG.value = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${cursorSize}" height="${cursorSize}" fill="${borderColor.value.hex}" class="bi bi-circle-fill" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="8" stroke="#000" />
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


watch([tool, fillColor, borderColor, lineWidth], updateCursorSVG, { immediate: true });

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
    window.addEventListener('keydown', handleKeyDown); // Добавляем обработчик нажатия клавиш

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

    $socketPlugin.on('startDrawing', (compressedData) => {
        const data = JSON.parse(LZString.decompress(compressedData));

        tool.value = data.tool;
        fillColor.value.hex = data.fillColor;
        borderColor.value.hex = data.borderColor;
        lineWidth.value = data.lineWidth;

        startDrawing(data.currentPos.x, data.currentPos.y, false);
    });

    $socketPlugin.on('drawing', (compressedData) => {
        const data = JSON.parse(LZString.decompress(compressedData));
        draw(data.currentPos.x, data.currentPos.y, false);
    });

    $socketPlugin.on('stopDrawing', () => {
        stopDrawing(false);
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
    window.removeEventListener('keydown', handleKeyDown); // Убираем обработчик нажатия клавиш при размонтировании компонента
});

const handleKeyDown = (event) => {
    if (event.ctrlKey && event.key === 'z') {
        undo(); // Вызываем функцию undo при Ctrl+Z
        event.preventDefault(); // Предотвращаем стандартное поведение браузера
    }
    if (event.ctrlKey && event.key === 'y') {
        redo(); // Вызываем функцию redo при Ctrl+Y
        event.preventDefault(); // Предотвращаем стандартное поведение браузера
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
            fillColor: fillColor.value.hex,
            borderColor: borderColor.value.hex,
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
    context.value.strokeStyle = borderColor.value.hex;

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

            context.value.fillStyle = fillColor.value.hex;
            context.value.fillRect(startPos.x, startPos.y, currentX - startPos.x, currentY - startPos.y);

            context.value.strokeStyle = borderColor.value.hex;
            context.value.strokeRect(startPos.x, startPos.y, currentX - startPos.x, currentY - startPos.y);

        } else if (tool_name === 'circle') {

            const width = currentX - startPos.x;
            const height = currentY - startPos.y;
            const radiusX = Math.abs(width / 2);
            const radiusY = radiusX;
            const centerX = startPos.x + width / 2;
            const centerY = startPos.y + height / 2;

            context.value.fillStyle = fillColor.value.hex;
            context.value.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
            context.value.fill();
            context.value.strokeStyle = borderColor.value.hex;
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

    context.value.beginPath(); // Начинаем новый путь после остановки рисования

    if (local === true && props.streams_length > 1) {
        //Отправляем событие окончания рисования
        $socketPlugin.emit('stopDrawing');
    }
};

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
    gap: 4px;
    display: flex;
    flex-direction: column;
}

.controls>div {
    pointer-events: auto;
}
</style>