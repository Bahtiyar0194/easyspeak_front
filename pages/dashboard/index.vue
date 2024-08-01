<template>
    <div class="col-span-12">
        <div class="card p-6">
            <div v-if="current_step === 0">
                <p class="text-xl mb-5">Шаг 1. <b>{{ steps[0].title }}</b></p>

                <div v-for="(input, index) in inputs" :key="index" class="form-group-border active mb-5">
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

                <p class="font-bold text-3xl mb-8">{{ inputs[0].value }}</p>

                <div class="btn-wrap mb-5">
                    <button v-for="(str, index) in strArray" :key="index" class="btn btn-outline-primary">
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
</template>

<script setup>
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

const steps = ref([
    {
        title: 'Наберите предложение и его перевод'
    },
    {
        title: 'Настройка предложения'
    }
]);

const current_step = ref(0);

const inputs = ref([
    {
        title: 'Наберите предложение',
        lang: 'en',
        value: '',
        isEmpty: false,
        speech: true
    },
    {
        title: 'Наберите перевод предложения на русском языке',
        lang: 'ru',
        value: '',
        isEmpty: false
    },
    {
        title: 'Наберите перевод предложения на казахском языке',
        lang: 'kk',
        value: '',
        isEmpty: false
    }
]);

const strArray = ref([]);

const handleIpnuts = () => {
    error.value = false;
    for (let index = 0; index < inputs.value.length; index++) {
        let item = inputs.value[index];
        if (item.value === '') {
            inputs.value[index].isEmpty = true;
            error.value = true;
        }
    }

    if (error.value === false) {

        const splitStr = inputs.value[0].value;
        // Удаляем ненужные символы с помощью регулярного выражения
        const cleanedStr = splitStr.replace(/[{}|<>.,:;""!?\/]/g, '').replace(/\s+/g, " ");

        // Разбиваем строку на массив слов
        strArray.value = cleanedStr.split(' ').filter(word => word !== "");
        current_step.value = 1;
    }
}

</script>