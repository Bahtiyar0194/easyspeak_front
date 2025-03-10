<template>
  <div class="custom-grid">
    <div class="col-span-12">
      <ul class="list-group nowrap">
        <li
          class="list-item"
          v-for="(sentence, sentenceIndex) in selectedSentences"
          :key="sentenceIndex"
        >
          <div class="flex flex-col gap-y-3">
            <b class="text-xl my-2"
              >{{ sentenceIndex + 1 }}. {{ sentence.sentence }}</b
            >
          </div>
          <div class="custom-grid">
            <div class="col-span-12">
              <div class="card p-4">
                <div class="custom-grid">
                  <uploadOrSelectFile
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
