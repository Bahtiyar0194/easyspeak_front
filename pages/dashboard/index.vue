<template>
    <div class="col-span-12">
        <div class="card p-6">
            <div v-if="current_step === 0">
                <p class="text-xl mb-5">Шаг 1. <b>{{ steps[0].title }}</b></p>

                <div v-for="(input, index) in sentenceInputs" :key="index" class="form-group-border active mb-5">
                    <i class="pi pi-align-left"></i>
                    <input autoComplete="text" v-model="input.value" type="text" placeholder=" " />
                    <label :class="{ 'label-error': input.isEmpty }">
                        {{ input.title }}
                    </label>
                </div>

                <button class="btn btn-primary" @click="handleIpnuts">
                    <i class="pi pi-arrow-right"></i>
                    {{ $t("continue") }}
                </button>
            </div>

            <div v-if="current_step === 1">
                <p class="text-xl mb-8">Шаг 2. <b>{{ steps[1].title }}</b></p>

                <div class="btn-wrap items-start mb-6">
                    <audioButton :src="'/audio/1.mp3'" />
                    <p class="font-bold text-3xl">{{ sentenceInputs[0].value }}</p>
                </div>

                <div class="btn-wrap mb-5">
                    <button v-for="(str, index) in strArray" :key="index" @click="selectWord(index)"
                        class="btn btn-sm btn-outline-primary">
                        {{ str }}
                    </button>
                </div>

                <div class="btn-wrap ">
                    <button class="btn btn-light" @click="current_step = 0">
                        <i class="pi pi-arrow-left"></i>
                        {{ $t("back") }}
                    </button>

                    <button class="btn btn-primary">
                        <i class="pi pi-arrow-right"></i>
                        {{ $t("continue") }}
                    </button>
                </div>
            </div>
        </div>
    </div>

    <modal :show="wordModalIsVisible" :onClose="() => wordModalIsVisible = false" :className="'modal-lg'"
        :showLoader="false" :closeOnClickSelf="true">
        <template v-slot:header_content>
            <h3>Добавление в словарь</h3>
        </template>
        <template v-slot:body_content>
            <div class="mt-2">
                <div v-for="(input, index) in wordInputs" :key="index" class="form-group-border active mb-4">
                    <i :class="input.icon"></i>
                    <input autoComplete="text" v-model="input.value" type="text" placeholder=" " />
                    <label :class="{ 'label-error': input.isEmpty }">
                        {{ input.title }}
                    </label>
                </div>

                <fileUploadButton :id="'word_poster_file'" :accept="'image/*'" :error="''" :icon="'pi pi-image'"
                    :label="$t('file.image.select')" :className="'mb-4'" />

                <fileUploadButton :id="'word_audio_file'" :accept="'audio/*'" :error="''" :icon="'pi pi-volume-up'"
                    :label="$t('file.audio.select')" :className="'mb-4'" />

                <button class="btn btn-primary" type="submit">
                    <i class="pi pi-check"></i>
                    <span>{{ $t("add_to_dictionary") }}</span>
                </button>
            </div>
        </template>
    </modal>
</template>

<script setup>
import modal from '../../components/ui/modal.vue';
import audioButton from '../../components/ui/audioButton.vue';
import fileUploadButton from '../../components/ui/fileUploadButton.vue';
const { t } = useI18n();
const error = ref(false);

useHead({
    title: t('pages.dashboard.title'),
    meta: [{ name: "description", content: "My amazing site." }],
});

definePageMeta({
    layout: "dashboard",
    middleware: ['sanctum:auth']
});

const strArray = ref([]);
const currentWord = ref(null);

const wordModalIsVisible = ref(false);

const selectWord = (index) => {
    wordModalIsVisible.value = true;
    currentWord.value = strArray.value[index];
}

const steps = ref([
    {
        title: 'Наберите предложение и его перевод'
    },
    {
        title: 'Настройка предложения'
    }
]);

const current_step = ref(0);

const sentenceInputs = ref([
    {
        title: 'Наберите предложение',
        lang: 'en',
        value: '',
        isEmpty: false,
        speech: true
    },
    {
        title: 'Перевод предложения на русском языке',
        lang: 'ru',
        value: '',
        isEmpty: false
    },
    {
        title: 'Перевод предложения на казахском языке',
        lang: 'kk',
        value: '',
        isEmpty: false
    }
]);

const wordInputs = ref([
    {
        title: 'Слово',
        name: 'word',
        icon: 'pi pi-align-left'
    },
    {
        title: 'Транскрипция',
        name: 'transcription',
        icon: 'bi bi-braces'
    },
    {
        title: 'Перевод слова на русском языке',
        name: 'word_ru',
        icon: 'pi pi-align-left'
    },
    {
        title: 'Перевод слова на казахском языке',
        name: 'word_kk',
        icon: 'pi pi-align-left'
    }
]);

const handleIpnuts = () => {
    error.value = false;
    for (let index = 0; index < sentenceInputs.value.length; index++) {
        let item = sentenceInputs.value[index];
        if (item.value === '') {
            sentenceInputs.value[index].isEmpty = true;
            error.value = true;
        }
    }

    if (error.value === false) {
        const splitStr = sentenceInputs.value[0].value;
        // Удаляем ненужные символы с помощью регулярного выражения
        const cleanedStr = splitStr.replace(/[{}|<>.,:;""!?\/]/g, '').replace(/\s+/g, " ");
        // Разбиваем строку на массив слов
        strArray.value = cleanedStr.split(' ').filter(word => word !== "");
        current_step.value = 1;
    }
}

</script>