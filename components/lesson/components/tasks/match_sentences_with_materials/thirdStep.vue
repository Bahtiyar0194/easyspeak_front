<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <ul class="list-group nowrap">
        <li
          class="list-item"
          v-for="(sentence, sentenceIndex) in selectedSentences"
          :key="sentenceIndex"
        >
          <p class="text-xl font-medium mb-3 mt-2">
            {{ sentenceIndex + 1 }}. {{ sentence.sentence }}
          </p>

          <div class="custom-grid">
            <div v-if="sentence.material" class="col-span-12">
              <previewFileInput
                :fileType="sentenceMaterialTypeSlug"
                :previewUrl="
                  config.public.apiBase +
                  '/media/get/' +
                  sentence.material.target
                "
                :onChange="() => (sentence.material = null)"
              />
            </div>
            <div v-else class="col-span-12">
              <div class="card p-4">
                <div class="custom-grid">
                  <uploadOrSelectFile
                    :key="'upload_sentence_file_' + sentenceIndex"
                    :radioName="'upload_sentence_file_' + sentenceIndex"
                    :fileInputName="'file_name_' + sentenceIndex"
                    :uploadingFileName="'file_' + sentenceIndex"
                    :libraryFileName="'file_from_library_' + sentenceIndex"
                    :accept="sentenceMaterialTypeSlug"
                    :icon="
                      'pi pi-' +
                      (sentenceMaterialTypeSlug === 'audio'
                        ? 'volume-up'
                        : sentenceMaterialTypeSlug)
                    "
                    :errors="errors"
                  />
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
    <div v-if="errors.materials_failed" class="col-span-12">
      <p class="text-danger mb-0">{{ errors.materials_failed[0] }}</p>
    </div>
  </div>
</template>

<script setup>
import { toRefs, defineProps } from "vue";
import uploadOrSelectFile from "../../../../ui/uploadOrSelectFile.vue";
import previewFileInput from "../../../../ui/previewFileInput.vue";
const config = useRuntimeConfig();

const props = defineProps({
  errors: {
    type: Object,
    required: true,
  },

  selectedSentences: {
    type: Object,
    required: true,
  },

  sentenceMaterialTypeSlug: {
    type: Object,
    required: true,
  },
});

const { errors, selectedSentences, sentenceMaterialTypeSlug } = toRefs(props);
</script>
