<template>
  <client-only>
    <ul class="breadcrumb">
      <li v-if="!route.meta.layout">
        <nuxt-link to="/">
          <span>{{ $t('pages.home.title') }}</span>
        </nuxt-link>
      </li>
      <li v-for="(crumb, index) in crumbs" :key="index">
        <nuxt-link :class="index < crumbs.length - 1 ? '' : 'inactive'" :to="crumb.to">
          <span :data-crumb="crumb.label">{{ crumb.label }}</span>
        </nuxt-link>
      </li>
    </ul>
  </client-only>
</template>

<script setup>
const { t } = useI18n();
const route = useRoute();

const crumbs = computed(() => {
  // Разбиваем путь на отдельные части
  let fullPath = route.path.split("/").filter((path) => path);

  const getTitle = (index) => {
    // Проход по ключам объекта
    const key = Object.keys(route.params).find(
      (k) => route.params[k] === fullPath[index]
    );

    if (key) {
      return "[" + key + "]";
    } else {
      return t("pages." + fullPath[index] + ".title");
    }
  };

  // Формируем хлебные крошки
  return fullPath.map((path, index) => ({
    to: "/" + fullPath.slice(0, index + 1).join("/"),
    label: getTitle(index),
  }));
});
</script>
