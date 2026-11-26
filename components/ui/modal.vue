<template>
  <div
    class="modal-backdrop"
    :class="isVisible && 'show'"
    :inert="!isVisible || undefined"
    :aria-hidden="!isVisible || undefined"
    @click.self="props.closeOnClickSelf && closeModal()"
  >
    <div
      ref="dialogRef"
      class="modal"
      :class="props.className"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      @keydown.tab="trapFocus"
    >
      <loader
        v-if="props.showLoader"
        :className="
          props.loaderOpacityFull === true ? 'overlay opacity-full' : 'overlay'
        "
        :showPendingText="props.showPendingText"
        :pendingText="props.pendingText"
        :progress="props.progress"
      />
      <div class="modal-header">
        <slot name="header_content" />
        <button
          type="button"
          :title="$t('close')"
          :aria-label="$t('close')"
          @click="closeModal"
          class="modal-close-button"
        >
          <i class="bi bi-x" aria-hidden="true"></i>
        </button>
      </div>
      <div class="modal-body">
        <slot name="body_content" />
      </div>
    </div>
  </div>
</template>

<script>
// Общее для всех модалок состояние: стек открытых окон (Esc закрывает только
// верхнее) и счётчик для блокировки прокрутки страницы под окнами.
const openStack = [];
let savedOverflow = "";
let savedPaddingRight = "";

const lockScroll = () => {
  if (openStack.length !== 1) return;
  const html = document.documentElement;
  const scrollbarWidth = window.innerWidth - html.clientWidth;
  savedOverflow = html.style.overflow;
  savedPaddingRight = document.body.style.paddingRight;
  html.style.overflow = "hidden";
  // Компенсируем исчезнувший скроллбар, чтобы страница не «прыгала».
  if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
};

const unlockScroll = () => {
  if (openStack.length !== 0) return;
  document.documentElement.style.overflow = savedOverflow;
  document.body.style.paddingRight = savedPaddingRight;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
</script>

<script setup>
import { watch, ref, nextTick, onMounted, onBeforeUnmount } from "vue";
import loader from "./loader.vue";

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  className: {
    type: String,
    required: false,
  },
  showLoader: {
    type: Boolean,
    required: false,
  },
  progress: {
    type: Number,
    required: false,
    default: 0,
  },
  loaderOpacityFull: {
    type: Boolean,
    required: false,
  },
  onClose: {
    type: Function,
    required: true,
  },
  closeOnClickSelf: {
    type: Boolean,
    required: true,
  },
  showPendingText: {
    type: Boolean,
    required: false,
    default: false,
  },
  pendingText: {
    type: String,
    required: false,
    default: "",
  },
  // Закрывать ли окно клавишей Esc.
  closeOnEsc: {
    type: Boolean,
    required: false,
    default: true,
  },
});

const isVisible = ref(props.show);
const dialogRef = ref(null);
const instanceId = Symbol("modal");
let previouslyFocused = null;
let isOpen = false;

const closeModal = () => {
  isVisible.value = false;
  if (props.onClose) {
    props.onClose();
  }
};

const onKeydown = (e) => {
  if (e.key !== "Escape" || e.defaultPrevented) return;
  if (openStack[openStack.length - 1] !== instanceId) return;
  // Пока идёт сохранение, оверлей лоадера перекрывает и кнопку закрытия.
  if (!props.closeOnEsc || props.showLoader) return;
  e.preventDefault();
  closeModal();
};

const getFocusable = () =>
  dialogRef.value
    ? [...dialogRef.value.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )
    : [];

// Tab / Shift+Tab не выпускают фокус за пределы окна.
const trapFocus = (e) => {
  const items = getFocusable();
  if (!items.length) {
    e.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || active === dialogRef.value)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
};

const onOpen = async () => {
  if (isOpen) return;
  isOpen = true;
  previouslyFocused = document.activeElement;
  openStack.push(instanceId);
  lockScroll();
  document.addEventListener("keydown", onKeydown);
  await nextTick();
  // Фокус на само окно, а не на первое поле: на телефоне это не открывает
  // клавиатуру поверх окна.
  if (isOpen && dialogRef.value && !dialogRef.value.contains(document.activeElement)) {
    dialogRef.value.focus({ preventScroll: true });
  }
};

const onHide = () => {
  if (!isOpen) return;
  isOpen = false;
  const idx = openStack.indexOf(instanceId);
  if (idx !== -1) openStack.splice(idx, 1);
  unlockScroll();
  document.removeEventListener("keydown", onKeydown);
  const target = previouslyFocused;
  previouslyFocused = null;
  if (target && target.isConnected && typeof target.focus === "function") {
    target.focus({ preventScroll: true });
  }
};

watch(
  () => props.show,
  (newVal) => {
    isVisible.value = newVal;
  },
);

watch(isVisible, (val) => (val ? onOpen() : onHide()));

onMounted(() => {
  if (isVisible.value) onOpen();
});

onBeforeUnmount(onHide);
</script>
