<template>
  <div
    v-for="(material, materialIndex) in props.materials"
    :key="materialIndex"
    class="col-span-12"
  >
    <p v-if="props.showTitle === true">
      <span v-if="props.materials.length > 1">{{
        materialIndex + 1 + "."
      }}</span>
      {{ $t("materials.learn." + (material.file_material_type_slug || material.block_material_type_slug)) }}
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
    <textViewer
      v-else-if="material.block_material_type_slug === 'text'"
      :htmlData="material.content"
    />
    <tableViewer
      v-else-if="material.block_material_type_slug === 'table'"
      :tableData="JSON.parse(material.content)"
    />
  </div>
</template>
<script setup>
import videoPlayer from "../../ui/videoPlayer.vue";
import audioPlayerWithWave from "../../ui/audioPlayerWithWave.vue";
import textViewer from "../../ui/textViewer.vue";
import tableViewer from "../../ui/tableViewer.vue";
const config = useRuntimeConfig();

const props = defineProps({
  materials: {
    type: Object,
    required: true,
  },
  showTitle: {
    type: Boolean,
    required: false,
    default: true,
  },
});
</script>
