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
            <span
              v-if="crumb.pending"
              class="skeleton inline-block h-3.5 w-20 align-middle"
              aria-hidden="true"
            ></span>
            <span v-else>{{ crumb.label }}</span>
          </nuxt-link>
          <span v-else class="breadcrumb-current" aria-current="page">
            <span
              v-if="crumb.pending"
              class="skeleton inline-block h-3.5 w-24 align-middle"
              aria-hidden="true"
            ></span>
            <span v-else>{{ crumb.label }}</span>
          </span>
        </li>
      </ol>
    </nav>
  </client-only>
</template>

<script setup>
import { useCrumbLabels } from "~/composables/useCrumbLabels";

const { t } = useI18n();
const route = useRoute();
const { labelFor } = useCrumbLabels();

// Параметры адреса, для которых страницы сообщают название (setCrumbLabels)
const NAMED_PARAMS = new Set(["course", "level", "section", "lesson", "id"]);

const crumbs = computed(() => {
  const fullPath = route.path.split("/").filter((path) => path);
  const paramKeys = Object.keys(route.params);

  const getTitle = (index) => {
    const pathPart = fullPath[index];

    // Определяем параметр по порядку
    const paramKey = paramKeys[index - (fullPath.length - paramKeys.length)];

    if (paramKey && route.params[paramKey] === pathPart) {
      // Название сообщает страница (useCrumbLabels); пока его нет — скелетон.
      // Прочие параметры (например, токен в ссылке смены пароля) не показываем
      if (!NAMED_PARAMS.has(paramKey)) return null;
      return { label: labelFor(paramKey, pathPart), pending: !labelFor(paramKey, pathPart) };
    }

    return { label: t("pages." + pathPart + ".title"), pending: false };
  };

  return fullPath
    .map((_, index) => {
      const title = getTitle(index);
      return title ? { to: "/" + fullPath.slice(0, index + 1).join("/"), ...title } : null;
    })
    .filter(Boolean);
});
</script>
