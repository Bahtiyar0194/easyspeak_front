<template>
  <!-- Обложка курса: загруженная школой → статическая картинка платформы →
       заглушка (у нового курса школы картинки может не быть вовсе) -->
  <img
    v-if="currentSrc"
    :key="currentSrc"
    v-skeleton="'3/2'"
    class="cover-card-img"
    :src="currentSrc"
    alt=""
    @error="index++"
  />
  <div v-else class="cover-card-img cover-card-placeholder" aria-hidden="true">
    <i class="pi pi-book"></i>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();

const props = defineProps({
  slug: { type: String, required: false, default: "" },
  poster: { type: String, required: false, default: null },
});

const sources = computed(() => {
  const list = [];
  if (props.poster) list.push(`${config.public.apiBase}/media/get/${props.poster}`);
  if (props.slug) list.push(`/images/courses/${props.slug}.png`);
  return list;
});

const index = ref(0);
watch(sources, () => (index.value = 0));

const currentSrc = computed(() => sources.value[index.value] || null);
</script>
