<template>
  <client-only>
    <!-- На главной кабинета одна «крошка» ничего не даёт — не показываем -->
    <nav
      v-if="crumbs.length > 1 || !route.meta.layout"
      class="breadcrumb-nav"
      :aria-label="$t('breadcrumb')"
    >
      <ol class="breadcrumb font-medium select-none">
        <li v-if="!route.meta.layout">
          <nuxt-link to="/" :title="$t('pages.home.title')">
            <i class="pi pi-home" aria-hidden="true"></i>
            <span class="sr-only">{{ $t("pages.home.title") }}</span>
          </nuxt-link>
        </li>
        <li v-for="(crumb, index) in crumbs" :key="index">
          <nuxt-link
            v-if="index < crumbs.length - 1"
            :to="crumb.to"
            :title="crumb.label"
          >
            <i
              v-if="index === 0 && route.meta.layout"
              class="pi pi-home mr-1"
              aria-hidden="true"
            ></i>
            <span :data-crumb="crumb.label">{{ crumb.label }}</span>
          </nuxt-link>
          <span v-else class="breadcrumb-current" aria-current="page">
            <span :data-crumb="crumb.label">{{ crumb.label }}</span>
          </span>
        </li>
      </ol>
    </nav>
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
