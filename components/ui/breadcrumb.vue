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
const route = useRoute()
const crumbs = computed(() => {
  const paths = route.path.split('/').filter(path => path)
  return paths.map((path, index) => ({
    to: '/' + paths.slice(0, index + 1).join('/'),
    label: t('pages.' + path + '.title'),
  }))
})
</script>