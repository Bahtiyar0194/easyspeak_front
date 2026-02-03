<template>
  <client-only>
    <ul class="breadcrumb font-medium">
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
  const fullPath = route.path.split("/").filter((path) => path);
  const paramKeys = Object.keys(route.params);

  const getTitle = (index) => {
    const pathPart = fullPath[index];

    // Определяем параметр по порядку
    const paramKey = paramKeys[index - (fullPath.length - paramKeys.length)];

    if (paramKey && route.params[paramKey] === pathPart) {
      return `[${paramKey}]`;
    }

    return t("pages." + pathPart + ".title");
  };

  return fullPath.map((_, index) => ({
    to: "/" + fullPath.slice(0, index + 1).join("/"),
    label: getTitle(index),
  }));
});

</script>
