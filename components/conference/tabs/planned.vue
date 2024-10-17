<template>
    <div class="custom-grid">
        <div class="col-span-12">
            <div class="btn-wrap">
                <roleProvider :roles="[1, 2]" :redirect="false">
                    <button class="btn btn-outline-primary">
                        <i class="bi bi-calendar-plus"></i>
                        {{ $t('add') }}
                    </button>
                </roleProvider>

                <button @click="() => search_filter = !search_filter" class="btn btn-light">
                    <i class="bi bi-search"></i>
                    {{ search_filter === true ? $t("hide_search_filter") : $t("show_search_filter") }}
                </button>
            </div>
        </div>

        <div v-if="search_filter" class="col-span-12 lg:col-span-3">
            <stickyBox>
                <template v-slot:content>
                    <div class="card p-4">
                        <h5>{{ $t('pages.conference.search_conference') }}</h5>

                        <form ref="form" @submit.prevent="handleSubmit">
                            <div class="custom-grid">
                                <div class="col-span-12">
                                    <div class="form-group-border active">
                                        <i class="pi pi-video"></i>
                                        <input autoComplete="conference_name" type="text" name="conference_name"
                                            placeholder=" " @input="debounceInput" />
                                        <label>{{ $t('name') }}</label>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </template>
            </stickyBox>
        </div>

        <div class="col-span-12" :class="search_filter && 'lg:col-span-9'">
            <div class="table selectable">
                <table>
                    <thead>
                        <tr>
                            <th>Название конференции</th>
                            <th>Начало</th>
                            <th>Продолжительность</th>
                            <th>Организатор</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in 100" :key="n">
                            <td>Unit 2 - Unit name</td>
                            <td>30.09.2024 в 14:00</td>
                            <td>30 мин</td>
                            <td>Kalauov Bakhtiyar</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import roleProvider from '../../ui/roleProvider.vue';
import stickyBox from '../../ui/stickyBox.vue';
import { debounceHandler } from '../../../utils/debounceHandler';
import { watch, ref } from 'vue';

const search_filter = ref(false);

const handleInput = (e) => {
    console.log(e.target.value);
    // Здесь можно добавить вашу логику, например, запрос к API
};

const debounceInput = debounceHandler(handleInput, 1000);

// const props = defineProps({
//     show: {
//         type: Boolean,
//         required: true
//     },
//     class: {
//         type: String,
//         required: false
//     },
//     onClose: {
//         type: Function,
//         required: true
//     }
// });

// const isVisible = ref(props.show)

// watch(() => props.show, (newVal) => {
//     isVisible.value = newVal;
// });

// const closeModal = () => {
//     isVisible.value = false
//     if (props.onClose) {
//         props.onClose()
//     }
// };
</script>