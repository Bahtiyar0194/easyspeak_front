<template>
  <button
    type="button"
    class="header-icon-btn"
    @click="toggleTheme"
    :title="label"
    :aria-label="label"
    :aria-pressed="theme === 'dark'"
  >
    <Transition name="theme-icon" mode="out-in">
      <i
        :key="theme"
        :class="theme === 'dark' ? 'bi bi-moon-stars' : 'bi bi-sun'"
        aria-hidden="true"
      ></i>
    </Transition>
  </button>
</template>

<script setup>
const { t } = useI18n();
const theme = ref("light");
const savedTheme = useCookie("theme", { maxAge: 60 * 60 * 24 * 365 });

const label = computed(() =>
  theme.value === "dark"
    ? t("theme.switch_to_a_light_theme")
    : t("theme.switch_to_a_dark_theme"),
);

onMounted(() => {
  theme.value = savedTheme.value || "light";
  document.documentElement.classList.toggle("dark", theme.value === "dark");
});

const toggleTheme = () => {
  theme.value = theme.value === "light" ? "dark" : "light";

  // Плавный переход цветов только на момент переключения темы
  const root = document.documentElement;
  root.classList.add("theme-transition");
  root.classList.toggle("dark", theme.value === "dark");
  window.setTimeout(() => root.classList.remove("theme-transition"), 350);

  savedTheme.value = theme.value;
};
</script>
