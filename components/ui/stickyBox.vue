<template>
  <div
    ref="boxRef"
    class="sticky sticky-box"
    :class="[props.className, { scrollable: maxHeight !== null }]"
    :style="boxStyle"
  >
    <div ref="contentRef">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { useScrollChain } from "~/composables/useScrollChain";

// Прилипающий блок (боковые фильтры, итоги заданий, шапка обычного макета).
//
// Если блок выше видимой области, раньше его низ оставался за краем экрана,
// пока не докрутишь список до конца (пропадали нижние поля и «Сбросить»).
// Теперь в этом случае высота ограничивается видимой областью, а внутри
// появляется своя прокрутка. Включается, только когда блок действительно
// может прилипнуть (рядом есть более длинная колонка) и не помещается —
// короткие блоки и шапка не меняются, их выпадающие меню не обрезаются.
// На телефоне, где фильтр стоит над списком, ограничения нет.
const props = defineProps({
  offsetTop: {
    type: Number,
    required: false,
  },

  offsetBottom: {
    type: Number,
    required: false,
  },

  className: {
    type: String,
    required: false,
    default: "",
  },
});

// Отступ снизу при ограничении высоты, если offsetBottom не задан
const BOTTOM_GAP = 12;

const boxRef = ref(null);
const contentRef = ref(null);
const maxHeight = ref(null);

const top = computed(() => (props.offsetTop >= 0 ? props.offsetTop : 0));

const boxStyle = computed(() => ({
  top: top.value + "px",
  bottom: props.offsetBottom >= 0 ? props.offsetBottom + "px" : undefined,
  maxHeight: maxHeight.value !== null ? maxHeight.value + "px" : undefined,
}));

// Ближайший прокручиваемый предок; null — прокручивается окно
const findScrollParent = (el) => {
  let node = el?.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const { overflowY } = getComputedStyle(node);
    if (/(auto|scroll|overlay)/.test(overflowY)) return node;
    node = node.parentElement;
  }
  return null;
};

let scrollParent = null;
let frame = 0;

const measure = () => {
  frame = 0;
  const box = boxRef.value;
  const content = contentRef.value;
  if (!box || !content) return;

  const natural = content.offsetHeight;
  const parent = box.parentElement;

  // Прилипнуть можно, только если колонка выше самого блока. Сравниваем с
  // естественной высотой содержимого — так ограничение не «мигает»
  const canStick = parent && parent.clientHeight > natural + 1;

  // Высота видимой области, в которой блок прилипает: от верхней точки
  // прилипания до низа контейнера прокрутки (с учётом его отступов)
  let available;
  const bottomGap = props.offsetBottom >= 0 ? props.offsetBottom : BOTTOM_GAP;

  if (scrollParent) {
    const rect = scrollParent.getBoundingClientRect();
    const style = getComputedStyle(scrollParent);
    const viewTop = Math.max(rect.top, 0) + parseFloat(style.paddingTop || 0);
    const viewBottom =
      Math.min(rect.bottom, window.innerHeight) - parseFloat(style.paddingBottom || 0);
    available = viewBottom - viewTop - top.value - bottomGap;
  } else {
    available = window.innerHeight - top.value - bottomGap;
  }

  // Слишком маленькое окно — пусть лучше прокручивается вместе со страницей
  const limited = canStick && available >= 200 && natural > available;
  maxHeight.value = limited ? Math.floor(available) : null;
};

const schedule = () => {
  if (frame) return;
  frame = requestAnimationFrame(measure);
};

let resizeObserver = null;

// Внутренняя прокрутка упёрлась в край — колесо сразу прокручивает страницу
useScrollChain(boxRef);

onMounted(() => {
  scrollParent = findScrollParent(boxRef.value);

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(contentRef.value);
    if (boxRef.value.parentElement) resizeObserver.observe(boxRef.value.parentElement);
    if (scrollParent) resizeObserver.observe(scrollParent);
  }
  window.addEventListener("resize", schedule);
  measure();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  window.removeEventListener("resize", schedule);
  if (frame) cancelAnimationFrame(frame);
});
</script>

<style scoped>
.sticky-box.scrollable {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--surface-border, rgba(127, 127, 127, 0.4)) transparent;
  /* Немного места справа под полосу прокрутки, чтобы она не легла на рамку карточки */
  padding-right: 4px;
  margin-right: -4px;
  border-radius: 1rem;
}

.sticky-box.scrollable::-webkit-scrollbar {
  width: 6px;
}

.sticky-box.scrollable::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background-color: var(--surface-border, rgba(127, 127, 127, 0.4));
}
</style>
