<template>
  <div class="col-span-12">
    <div class="btn-wrap mt-2 items-center">
      <button
        type="button"
        @click="toggleBold"
        class="btn btn-square btn-sm"
        :class="isBoldActive ? 'btn-primary' : 'btn-light'"
      >
        <i class="bi bi-type-bold"></i>
      </button>
      <button
        type="button"
        @click="toggleItalic"
        class="btn btn-square btn-sm"
        :class="isItalicActive ? 'btn-primary' : 'btn-light'"
      >
        <i class="bi bi-type-italic"></i>
      </button>
      <button
        type="button"
        @click="toggleUnderline"
        class="btn btn-square btn-sm"
        :class="isUnderlineActive ? 'btn-primary' : 'btn-light'"
      >
        <i class="bi bi-type-underline"></i>
      </button>
      <button
        type="button"
        @click="toggleHeading"
        class="btn btn-square btn-sm"
        :class="isHeadingActive ? 'btn-primary' : 'btn-light'"
      >
        <i class="bi bi-type-h2"></i>
      </button>
      <button
        type="button"
        @click="toggleBulletList"
        class="btn btn-square btn-sm"
        :class="isBulletListActive ? 'btn-primary' : 'btn-light'"
      >
        <i class="bi bi-list-ul"></i>
      </button>
      <button
        type="button"
        @click="toggleOrderedList"
        class="btn btn-square btn-sm"
        :class="isOrderedListActive ? 'btn-primary' : 'btn-light'"
      >
        <i class="bi bi-list-ol"></i>
      </button>

      <div class="per-page-select active" :class="'bg_active'">
        <select @change="setFontSize($event.target.value)">
          <option v-for="fontSize in fontSizes" :key="fontSize" :value="`${fontSize}px`">{{ fontSize + 'px' }}</option>
        </select>
        <label>{{ $t("board.font_size") }}</label>
      </div>
    </div>
  </div>
  <div class="col-span-12">
    <!-- Контентный редактор -->
    <editor-content :editor="editor" class="text-editor-content" />

    <!-- Скрытый input для хранения контента -->
    <input type="hidden" :name="props.inputName" :value="content" />
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import { FontSize } from "../../utils/fontSize";
import { fontSizes } from "../../utils/fontSizes";
import Underline from "@tiptap/extension-underline";

const props = defineProps({
  inputName: {
    type: String,
    required: true,
  },
  errors: {
    type: Object,
    required: true,
  },
});

const content = ref("<p>Привет, TipTap в Nuxt 3! 🚀</p>");

const editor = useEditor({
  content: content.value,
  extensions: [StarterKit, TextStyle, Underline, FontSize], // Добавляем поддержку размера шрифта Underline],
  onUpdate: ({ editor }) => {
    content.value = editor.getHTML(); // Обновляем скрытый input
  },
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});

// Функции для кнопок
const toggleBold = () => editor.value?.chain().focus().toggleBold().run();
const toggleItalic = () => editor.value?.chain().focus().toggleItalic().run();
const toggleUnderline = () =>
  editor.value?.chain().focus().toggleUnderline().run();

const toggleHeading = () =>
  editor.value?.chain().focus().toggleHeading({ level: 2 }).run();

const toggleBulletList = () =>
  editor.value?.chain().focus().toggleBulletList().run();

const toggleOrderedList = () =>
  editor.value?.chain().focus().toggleOrderedList().run();

const setFontSize = (size) =>
  editor.value?.chain().focus().setFontSize(size).run();

// Проверяем активные стили
const isBoldActive = computed(() => editor.value?.isActive("bold"));
const isItalicActive = computed(() => editor.value?.isActive("italic"));
const isUnderlineActive = computed(() => editor.value?.isActive("underline"));
const isHeadingActive = computed(() =>
  editor.value?.isActive("heading", { level: 2 })
);
const isBulletListActive = computed(() => editor.value?.isActive("bulletList"));
const isOrderedListActive = computed(() =>
  editor.value?.isActive("orderedList")
);

const { errors } = toRefs(props);
</script>
