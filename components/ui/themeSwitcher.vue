<template>
    <button @click="toggleTheme"
        :title="theme === 'dark' ? $t('theme.switch_to_a_light_theme') : $t('theme.switch_to_a_dark_theme')">
        <i :class="theme === 'dark' ? 'bi bi-moon' : 'bi bi-sun'"></i>
    </button>
</template>

<script setup>
const theme = ref('light');
const savedTheme = useCookie('theme');

onMounted(() => {
    theme.value = savedTheme.value || 'light';
    document.documentElement.classList.toggle('dark', theme.value === 'dark');
});

const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', theme.value === 'dark');
    savedTheme.value = theme.value;
}
</script>