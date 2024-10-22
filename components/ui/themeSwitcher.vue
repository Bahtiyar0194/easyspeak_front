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
    if (savedTheme.value === 'dark') {
        document.documentElement.classList.add('dark');
        theme.value = 'dark';
    } else {
        document.documentElement.classList.remove('dark');
        theme.value = 'light';
    }
});

const toggleTheme = () => {
    if (theme.value === 'light') {
        theme.value = 'dark';
        document.documentElement.classList.add('dark');
        savedTheme.value = 'dark';
    } else {
        theme.value = 'light';
        document.documentElement.classList.remove('dark');
        savedTheme.value = 'light';
    }
}
</script>