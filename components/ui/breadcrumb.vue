<template>
  <client-only>
    <ul class="breadcrumb">
      <li v-for="(crumb, index) in crumbs" :key="index">
        <nuxt-link v-if="index < crumbs.length - 1" :to="crumb.to">
          <span :data-crumb="crumb.label">{{ crumb.label }}</span>
        </nuxt-link>
        <span v-else :data-crumb="crumb.label">{{ crumb.label }}</span>
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