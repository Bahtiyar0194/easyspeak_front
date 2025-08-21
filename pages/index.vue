<template>
  <!-- Hero -->
  <section class="py-32 px-4 relative">
    <div class="slider-area">
      <ul class="slider-circles">
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
      </ul>
    </div>
    <div class="flex flex-col justify-center items-center text-center">
      <h1 class="mb-4 font-bold"><span ref="typedElement" /></h1>
      <div
        ref="fadeTarget"
        class="flex flex-col items-center"
        :class="[
          'transition-all duration-700 ease-out',
          showContent
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-4 pointer-events-none',
        ]"
      >
        <p class="text-lg mb-6">
          {{ $t("pages.home.hero.description") }}
        </p>
        <button
          @click="demoModalIsVisible = true"
          class="btn btn-primary btn-lg !px-8"
        >
          Запросить демонстрацию
        </button>
      </div>
    </div>
  </section>

  <section class="bg-corp py-20 px-4 lg:px-20">
    <div class="custom-grid">
      <div class="col-span-12 lg:col-span-6">
        <div class="card px-4 lg:px-6 py-12 !rounded-3xl">
          <h2 class="font-bold mb-8 text-center">Для учеников</h2>
          <ul class="px-0 space-y-4 list-none text-lg mb-4">
            <li>
              🎓 Личный кабинет с языковыми курсами, заданиями и прогрессом
            </li>
            <li>📱 Доступ с любого устройства — ПК, планшета, телефона</li>
            <li>💬 Чат с преподавателями и техподдержкой</li>
            <li>🏆 Мотивация: баллы, достижения, сертификаты</li>
            <li>📺 Уроки в записи и прямом эфире</li>
          </ul>

          <nuxt-link
            :to="localePath('/courses')"
            class="btn btn-lg !px-8 btn-primary mx-auto mt-8"
          >
            <i class="pi pi-book"></i>
            Перейти к курсам
          </nuxt-link>
        </div>
      </div>
      <div class="col-span-12 lg:col-span-6">
        <div class="card px-4 lg:px-6 py-12 !rounded-3xl">
          <h2 class="font-bold mb-8 text-center">
            Для школ и образовательных центров
          </h2>
          <ul class="px-0 space-y-4 list-none text-lg">
            <li>✅ Курсы, уроки, тесты, видео — всё под контролем</li>
            <li>✅ Расписание, оповещения и управление учениками</li>
            <li>✅ Подключение преподавателей и настройка ролей</li>
            <li>✅ Статистика, отчёты, оплата — всё в одном месте</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- <section class="bg-active py-20 px-4 lg:px-20">
    <h2 class="text-3xl font-bold mb-12 text-center">
      Как работает платформа?
    </h2>

    <div class="custom-grid">
      <div class="col-span-12 lg:col-span-4">
        <div class="card p-4">
          <h3 class="text-xl text-center mb-2">1. Зарегистрируйтесь</h3>
          <p class="text-center">
            Создайте аккаунт и настройте бренд, логотип, домен
          </p>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-4">
        <div class="card p-4">
          <h3 class="text-xl text-center mb-2">2. Добавьте курсы</h3>
          <p class="text-center">
            Создайте уроки, тесты, домашние задания и расписание
          </p>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-4">
        <div class="card p-4">
          <h3 class="text-xl text-center mb-2">3. Пригласите учеников</h3>
          <p class="text-center">
            Ученики получают доступ к личному кабинету и начинают обучение
          </p>
        </div>
      </div>
    </div>
  </section> -->

  <!-- Кому подойдёт -->
  <section class="py-16 px-4 lg:px-20 bg-inactive">
    <h2 class="text-center font-bold mb-12">Кому подойдёт платформа?</h2>

    <div class="custom-grid">
      <div class="col-span-12 lg:col-span-4">
        <div class="card p-4 text-center">
          <h3 class="mb-2">Школам</h3>
          <p>
            Брендированная онлайн-платформа с личными кабинетами учеников и
            преподавателей
          </p>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-4">
        <div class="card p-4 text-center">
          <h3 class="mb-2">Преподавателям</h3>
          <p>
            Инструменты для проведения уроков, контроля успеваемости и загрузки
            материалов
          </p>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-4">
        <div class="card p-4 text-center">
          <h3 class="mb-2">Ученикам</h3>
          <p>
            Удобный доступ к обучению, расписанию, домашним заданиям и прогрессу
          </p>
        </div>
      </div>
    </div>
  </section>

  <section id="demo" class="py-20 px-4 bg-corp text-white text-center">
    <div class="flex flex-col justify-center items-center text-center">
      <h2 class="text-3xl font-bold mb-4">Готовы запустить свою платформу?</h2>
      <p class="text-lg mb-6">
        Оставьте заявку, и мы покажем, как легко начать
      </p>
      <button
        @click="demoModalIsVisible = true"
        class="btn btn-light btn-lg !px-8"
      >
        Запросить демонстрацию
      </button>
    </div>
  </section>

  <!-- <modal
    :show="demoModalIsVisible"
    :onClose="() => (demoModalIsVisible = false)"
    :className="'modal-lg'"
    :showLoader="pendingSend"
    :closeOnClickSelf="false"
  >
    <template v-slot:header_content>
      <h4>{{ $t("pages.home.demo_modal.title") }}</h4>
    </template>
    <template v-slot:body_content>
      <p>
        {{ $t("pages.home.demo_modal.description") }}
      </p>
      <form @submit.prevent="sendRequestToDemo" ref="formRef">
        <div class="form-group-border active mb-5 mt-4">
          <i class="pi pi-user"></i>
          <input
            autoComplete="new-user-name"
            name="name"
            type="text"
            placeholder=" "
          />
          <label :class="{ 'label-error': errors.name }">
            {{ errors.name ? errors.name[0] : $t("form.first_name") }}
          </label>
        </div>

        <div class="form-group-border active mb-5">
          <i class="pi pi-mobile"></i>
          <input
            autoComplete="phone"
            name="phone"
            v-mask="'+7 (###) ###-####'"
            placeholder=" "
          />
          <label :class="{ 'label-error': errors.phone }">
            {{ errors.phone ? errors.phone[0] : $t("form.phone") }}
          </label>
        </div>

        <label class="custom-radio-checkbox">
          <input type="checkbox" v-model="accept" />
          <span
            ><p>
              {{ $t("pages.home.demo_modal.consent.text") }}
              <nuxt-link to="/privacy-policy" target="_blank">{{
                $t("pages.home.demo_modal.consent.link")
              }}</nuxt-link
              >{{ $t("pages.home.demo_modal.consent.text_2") }}
            </p></span
          >
        </label>

        <button
          type="submit"
          class="btn btn-primary"
          :class="!accept ? 'disabled' : ''"
        >
          <i class="pi pi-arrow-right"></i>
          {{ $t("continue") }}
        </button>
      </form>
    </template>
  </modal> -->
</template>

<script setup>
import Typed from "typed.js";
import { onMounted, onBeforeUnmount, ref } from "vue";
//import modal from "../components/ui/modal.vue";
const { t, localeProperties } = useI18n();
const { $axiosPlugin } = useNuxtApp();
const demoModalIsVisible = ref(false);
const pendingSend = ref(false);
const requestIsSend = ref(false);
const accept = ref(false);
const errors = ref([]);
const formRef = ref(null);

const showContent = ref(false);
const typedElement = ref();
let typedInstance = null;

const sendRequestToDemo = async () => {
  pendingSend.value = true;
  const formData = new FormData(formRef.value);
  formData.append("lang", localeProperties.value.name);
  await $axiosPlugin
    .post("/demo/request", formData)
    .then((res) => {
      requestIsSend.value = true;
      errors.value = [];
    })
    .catch((err) => {
      errors.value = err.response.data;
    })
    .finally(() => {
      pendingSend.value = false;
    });
};

const initTyped = () => {
  if (typedInstance) {
    typedInstance.destroy();
    showContent.value = false;
  }

  typedInstance = new Typed(typedElement.value, {
    strings: [t("pages.home.hero.title")],
    typeSpeed: 40,
    backSpeed: 20,
    backDelay: 1000,
    loop: false,
    smartBackspace: true,
    showCursor: true,
    cursorChar: "|",
    onComplete: () => {
      showContent.value = true;
    },
  });
};

onMounted(() => {
  initTyped();
});

onBeforeUnmount(() => {
  if (typedInstance) {
    typedInstance.destroy();
  }
});
</script>
