<template>
  <div
    v-for="(material, materialIndex) in props.materials"
    :key="materialIndex"
    class="col-span-12"
  >
    <p>
      <span v-if="props.materials.length > 1">{{
        materialIndex + 1 + "."
      }}</span>
      {{ $t("materials.learn." + material.file_material_type_slug) }}
    </p>
    <videoPlayer
      v-if="material.file_material_type_slug === 'video'"
      :src="config.public.apiBase + '/media/get/' + material.target"
    />
    <audioPlayerWithWave
      v-else-if="material.file_material_type_slug === 'audio'"
      :src="config.public.apiBase + '/media/get/' + material.target"
    />
    <img
      v-else-if="material.file_material_type_slug === 'image'"
      :src="config.public.apiBase + '/media/get/' + material.target"
      class="w-full h-auto"
    />
  </div>
</template>
<script setup>
import videoPlayer from "../../ui/videoPlayer.vue";
import audioPlayerWithWave from "../../ui/audioPlayerWithWave.vue";
const config = useRuntimeConfig();

const props = defineProps({
  materials: {
    type: Object,
    required: true,
  },
});
</script>
