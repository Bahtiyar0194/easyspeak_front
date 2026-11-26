<template>
  <div
    class="avatar-ring w-fit h-fit"
    :class="props.padding ? 'p-' + props.padding : 'p-0.5'"
    :title="fullName || undefined"
  >
    <!-- Отмеченный (например, в списке выбора) -->
    <div
      v-if="props.isChecked === true"
      class="avatar-face bg-success text-white"
      :class="props.className"
    >
      <i class="pi pi-check" aria-hidden="true"></i>
    </div>

    <!-- Фото -->
    <img
      v-else-if="avatarUrl && !imageFailed"
      :src="avatarUrl"
      :alt="fullName"
      class="avatar-face object-cover"
      :class="props.className"
      loading="lazy"
      decoding="async"
      @error="imageFailed = true"
    />

    <!-- Инициалы на цветном фоне (цвет постоянный для человека) -->
    <div
      v-else
      class="avatar-face avatar-initials"
      :class="props.className"
      :style="{ backgroundColor: color }"
      :aria-label="fullName || undefined"
      role="img"
    >
      <template v-if="initials">{{ initials }}</template>
      <i v-else class="pi pi-user" aria-hidden="true"></i>
    </div>
  </div>
</template>

<script setup>
import { useRuntimeConfig } from "nuxt/app";
const config = useRuntimeConfig();

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  padding: {
    type: Number,
    required: false,
  },
  className: {
    type: String,
    required: false,
  },
  isChecked: {
    type: Boolean,
    required: false,
  },
});

// Спокойная палитра: белый текст читается на каждом цвете
const PALETTE = [
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#d97706", // amber
  "#16a34a", // green
  "#0d9488", // teal
  "#0891b2", // cyan
];

const fullName = computed(() =>
  `${props.user?.last_name || ""} ${props.user?.first_name || ""}`.trim(),
);

const initials = computed(() =>
  (
    (props.user?.last_name || "").trim().charAt(0) +
    (props.user?.first_name || "").trim().charAt(0)
  ).toUpperCase(),
);

// Один и тот же человек — всегда один и тот же цвет
const color = computed(() => {
  const key = props.user?.user_id ?? fullName.value;
  const str = String(key || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
});

const avatarUrl = computed(() => {
  const avatar = props.user?.avatar;
  if (!avatar) return "";
  return String(avatar).startsWith("http")
    ? avatar
    : config.public.apiBase + "/auth/get_avatar/" + avatar;
});

// Битая ссылка на фото → показываем инициалы; при смене фото пробуем снова
const imageFailed = ref(false);
watch(avatarUrl, () => (imageFailed.value = false));
</script>
