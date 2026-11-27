<template>
  <div class="avatar-cropper">
    <!-- Квадратная область: фото двигается пальцем / мышью, круг показывает,
         как аватар будет выглядеть -->
    <div
      ref="viewportRef"
      class="avatar-cropper-viewport"
      :class="{ dragging }"
      tabindex="0"
      :aria-label="$t('pages.profile.avatar.crop_hint')"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @wheel.prevent="onWheel"
      @keydown="onKeydown"
    >
      <img
        v-if="imageUrl"
        ref="imgRef"
        :src="imageUrl"
        alt=""
        draggable="false"
        class="avatar-cropper-img"
        :style="imageStyle"
        @load="onImageLoad"
      />
      <div class="avatar-cropper-mask" aria-hidden="true"></div>
    </div>

    <div class="avatar-cropper-zoom">
      <i class="pi pi-search-minus text-inactive" aria-hidden="true"></i>
      <input
        type="range"
        min="1"
        max="4"
        step="0.01"
        :value="zoom"
        :aria-label="$t('pages.profile.avatar.zoom')"
        @input="setZoom(Number($event.target.value))"
      />
      <i class="pi pi-search-plus text-inactive" aria-hidden="true"></i>
    </div>

    <p class="mb-0 text-xs text-inactive text-center">
      {{ $t("pages.profile.avatar.crop_hint") }}
    </p>
  </div>
</template>

<script setup>
// Обрезка аватара до квадрата без сторонних библиотек.
// Фото всегда закрывает квадрат целиком: zoom = 1 — по меньшей стороне.
// getBlob() отдаёт JPEG 512×512 выбранной области.
const props = defineProps({
  file: { type: [File, Blob], default: null },
});

const OUTPUT = 512;

const viewportRef = ref(null);
const imgRef = ref(null);
const imageUrl = ref("");
const natural = reactive({ w: 0, h: 0 });
const size = ref(0); // сторона квадрата на экране
const zoom = ref(1);
const pos = reactive({ x: 0, y: 0 }); // левый верхний угол фото внутри квадрата

const baseScale = computed(() =>
  natural.w && natural.h && size.value
    ? Math.max(size.value / natural.w, size.value / natural.h)
    : 1,
);
const scale = computed(() => baseScale.value * zoom.value);

const imageStyle = computed(() => ({
  width: natural.w * scale.value + "px",
  height: natural.h * scale.value + "px",
  transform: `translate(${pos.x}px, ${pos.y}px)`,
}));

// Фото не должно открывать пустые края квадрата
const clamp = () => {
  const w = natural.w * scale.value;
  const h = natural.h * scale.value;
  pos.x = Math.min(0, Math.max(size.value - w, pos.x));
  pos.y = Math.min(0, Math.max(size.value - h, pos.y));
};

const center = () => {
  pos.x = (size.value - natural.w * scale.value) / 2;
  pos.y = (size.value - natural.h * scale.value) / 2;
};

// Масштаб относительно центра квадрата — точка в центре остаётся на месте
const setZoom = (next) => {
  const z = Math.min(4, Math.max(1, next));
  const old = scale.value;
  const cx = (size.value / 2 - pos.x) / old;
  const cy = (size.value / 2 - pos.y) / old;
  zoom.value = z;
  pos.x = size.value / 2 - cx * scale.value;
  pos.y = size.value / 2 - cy * scale.value;
  clamp();
};

const measure = () => {
  const prev = size.value;
  size.value = viewportRef.value?.clientWidth || 0;
  // Окно ещё открывалось (размер был 0), когда загрузилось фото — центрируем
  // по настоящему размеру, а не прижимаем к краю
  if (!prev && size.value && natural.w) center();
  else clamp();
};

const onImageLoad = () => {
  natural.w = imgRef.value.naturalWidth;
  natural.h = imgRef.value.naturalHeight;
  zoom.value = 1;
  measure();
  center();
};

watch(
  () => props.file,
  (file) => {
    if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
    imageUrl.value = file ? URL.createObjectURL(file) : "";
  },
  { immediate: true },
);

/* ---------- Перетаскивание ---------- */
const dragging = ref(false);
let start = null;

const onPointerDown = (e) => {
  dragging.value = true;
  start = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
  e.currentTarget.setPointerCapture?.(e.pointerId);
};

const onPointerMove = (e) => {
  if (!dragging.value || !start) return;
  pos.x = start.px + (e.clientX - start.x);
  pos.y = start.py + (e.clientY - start.y);
  clamp();
};

const onPointerUp = () => {
  dragging.value = false;
  start = null;
};

const onWheel = (e) => setZoom(zoom.value * (e.deltaY < 0 ? 1.08 : 1 / 1.08));

// Клавиатура: стрелки двигают фото, + / − масштаб
const onKeydown = (e) => {
  const step = 10;
  if (e.key === "ArrowLeft") pos.x += step;
  else if (e.key === "ArrowRight") pos.x -= step;
  else if (e.key === "ArrowUp") pos.y += step;
  else if (e.key === "ArrowDown") pos.y -= step;
  else if (e.key === "+" || e.key === "=") return setZoom(zoom.value * 1.1);
  else if (e.key === "-") return setZoom(zoom.value / 1.1);
  else return;
  e.preventDefault();
  clamp();
};

/* ---------- Результат ---------- */
const getBlob = () =>
  new Promise((resolve, reject) => {
    if (!imgRef.value || !natural.w) return reject(new Error("no image"));
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    const s = scale.value;
    ctx.drawImage(
      imgRef.value,
      -pos.x / s,
      -pos.y / s,
      size.value / s,
      size.value / s,
      0,
      0,
      OUTPUT,
      OUTPUT,
    );
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob"))), "image/jpeg", 0.9);
  });

defineExpose({ getBlob });

let resizeObserver = null;
onMounted(() => {
  if (typeof ResizeObserver !== "undefined" && viewportRef.value) {
    resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(viewportRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value);
});
</script>
