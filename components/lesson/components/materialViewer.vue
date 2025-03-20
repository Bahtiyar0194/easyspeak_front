<template>
  <videoPlayer
    v-if="props.material.file_material_type_slug === 'video'"
    :src="config.public.apiBase + '/media/get/' + props.material.target"
  />
  <audioPlayerWithWave
    v-else-if="props.material.file_material_type_slug === 'audio'"
    :src="config.public.apiBase + '/media/get/' + props.material.target"
  />
  <img
    v-else-if="props.material.file_material_type_slug === 'image'"
    :src="config.public.apiBase + '/media/get/' + props.material.target"
    class="w-full h-auto"
  />
  <textViewer
    v-else-if="props.material.block_material_type_slug === 'text'"
    :htmlData="props.material.content"
  />
  <tableViewer
    v-else-if="props.material.block_material_type_slug === 'table'"
    :tableData="JSON.parse(props.material.content)"
  />
</template>
<script setup>
import videoPlayer from "../../ui/videoPlayer.vue";
import audioPlayerWithWave from "../../ui/audioPlayerWithWave.vue";
import textViewer from "../../ui/textViewer.vue";
import tableViewer from "../../ui/tableViewer.vue";
const config = useRuntimeConfig();

const props = defineProps({
  material: {
    type: Object,
    required: true,
  },
});
</script>
