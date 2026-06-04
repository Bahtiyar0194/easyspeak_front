<template>
  <client-only>
    <div class="custom-grid">
      <div
        :class="
          props.showChat === true ? 'col-span-12 lg:col-span-7' : 'col-span-12'
        "
      >
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
          :tableData="props.material.content"
          :options="JSON.parse(props.material.options)"
        />
      </div>
      <div v-if="props.showChat === true" class="col-span-12 lg:col-span-5">
        <stickyBox>
          <aiExplainer :explainMode="'material'" :material="props.material" />
        </stickyBox>
      </div>
    </div>
  </client-only>
</template>
<script setup>
import stickyBox from "../../ui/stickyBox.vue";
import videoPlayer from "../../ui/videoPlayer.vue";
import audioPlayerWithWave from "../../ui/audioPlayerWithWave.vue";
import textViewer from "../../ui/textViewer.vue";
import tableViewer from "../../ui/tableViewer.vue";
import aiExplainer from "./ai/aiExplainer.vue";
const config = useRuntimeConfig();

const props = defineProps({
  material: {
    type: Object,
    required: true,
  },

  showChat: {
    type: Boolean,
    required: false,
    default: false,
  },
});
</script>
