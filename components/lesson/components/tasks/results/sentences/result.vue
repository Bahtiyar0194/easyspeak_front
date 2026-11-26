<template>
  <resultList :sections="sections" />
</template>

<script setup>
import resultList from "../resultList.vue";

const { t } = useI18n();

const props = defineProps({
  studiedSentences: {
    type: Object,
    required: true,
  },
  reStudySentences: {
    type: Object,
    required: true,
  },
});

const toItem = (sentence) => ({
  title: sentence.sentence,
  subtitle: sentence.sentence_translate,
  audio: sentence.audio_file,
});

const sections = computed(() => [
  {
    title: t("pages.sentences.studied_sentences"),
    tone: "ok",
    icon: "pi-check",
    items: (props.studiedSentences || []).map(toItem),
  },
  {
    title: t("pages.sentences.unstudied_sentences"),
    tone: "bad",
    icon: "pi-replay",
    items: (props.reStudySentences || []).map(toItem),
  },
]);
</script>
