<template>
    <div class="col-span-12 lg:col-span-6 lg:col-start-4 mt-6">
        <h4 class="mb-1">{{ $t('pages.training.word_translation.title') }}</h4>
        <p class="mb-8">{{ $t('pages.training.word_translation.description') }}</p>
        <div class="flex items-center flex-col mb-6">
            <img class="w-56 h-auto rounded-xl mb-6"
                src="https://cdn-download.lingualeo.com/leocity_dictionary_prod/word_images/b5eedc7e-dbcf-45b2-87f4-41e6a4f218c5.png">

            <h2 class="mb-8">{{ wordToTranslate }}</h2>

            <div class="custom-grid">
                <div v-for="(answer, index) in answers" :key="index" class="col-span-12 lg:col-span-6">
                    <trainingButton :text="answer.text" :number="index + 1" @click="checkAnswer(index + 1)" />
                </div>
            </div>
        </div>

        <p class="text-inactive text-center hidden lg:block">{{ $t('pages.training.keyboard') }}</p>
    </div>
</template>

<script setup>
import trainingButton from '../../../components/ui/trainingButton.vue';
const { t } = useI18n();

useHead({
    title: t('pages.training.title'),
    meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
    layout: "dashboard",
    middleware: ['sanctum:auth']
});

// The word to translate and the correct answer number
const wordToTranslate = "ащы";
const correctAnswer = 1;

// Answer options for buttons
const answers = [
    { text: 'bitter' },
    { text: 'sweet' },
    { text: 'salty' },
    { text: 'sour' }
];

// Function to log key number and handle answer checking
const logNumber = (event) => {
    const key = event.key;
    if (key >= '1' && key <= answers.length) {
        checkAnswer(parseInt(key));
    }
};

// Function to check if the answer is correct
const checkAnswer = (number) => {
    if (number === correctAnswer) {
        alert('Correct!');
    } else {
        alert('Try again!');
    }
};

onMounted(() => {
    // Добавляем обработчик событий при монтировании компонента
    window.addEventListener('keydown', logNumber);
});

onBeforeUnmount(() => {
    // Убираем обработчик событий при размонтировании компонента
    window.removeEventListener('keydown', logNumber);
});
</script>