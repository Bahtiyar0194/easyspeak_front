<template>
    <dropdownMenu>
        <template v-slot:btn_content>
            <span>{{ localeProperties.short_name }}</span>
        </template>

        <template v-slot:menu_content>
            <li v-for="l in locales" :key="l.code">
                <button @click="changeLocale(l.code)">
                    {{ l.name }}
                </button>
            </li>
        </template>
    </dropdownMenu>
</template>
<script setup>
import dropdownMenu from './dropdownMenu';
const { localeProperties, locales, setLocale, } = useI18n();

const changeLocale = (value) => {
    setLocale(value)
}
</script>