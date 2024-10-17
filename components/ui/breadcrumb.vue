<template>
  <ul class="breadcrumb">
    <li v-for="(crumb, index) in crumbs" :key="index">
      <nuxt-link v-if="index < crumbs.length - 1" :to="crumb.to">{{ crumb.label }}</nuxt-link>
      <span v-else>{{ crumb.label }}</span>
    </li>
  </ul>
</template>

<script setup>
const { t } = useI18n();
const route = useRoute();

const crumbs = computed(() => {
  // Разбиваем путь на отдельные части
  let paths = route.path.split('/').filter(path => path);
  
  // Проверяем, есть ли параметры в маршруте
  if (Object.keys(route.params).length > 0) {
    // Удаляем последний элемент, если маршрут содержит параметры
    paths = paths.slice(0, -1);
  }

  // Формируем хлебные крошки
  return paths.map((path, index) => ({
    to: '/' + paths.slice(0, index + 1).join('/'),
    label: t('pages.' + path + '.title'),
  }));
});
</script>
