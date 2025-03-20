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
      {{
        $t(
          "materials.learn." +
            (material.file_material_type_slug ||
              material.block_material_type_slug)
        )
      }}
    </p>
    <materialViewer :material="material" />
  </div>
</template>
<script setup>
import materialViewer from "./materialViewer.vue";
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
