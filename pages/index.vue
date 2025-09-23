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
      <h1 class="mb-4"><span ref="typedElement" /></h1>
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
          {{ $t("pages.home.demo.request_button") }}
        </button>
      </div>
    </div>
  </section>

  <section class="bg-corp py-20 px-4 lg:px-20">
    <div class="custom-grid">
      <div class="col-span-12 md:col-span-6">
        <div class="card px-4 lg:px-6 py-12 !rounded-3xl">
          <h2 class="mb-8 text-center">
            {{ $t("pages.home.section_2.card_1.title") }}
          </h2>
          <ul class="px-0 space-y-4 list-none text-lg mb-4">
            <li>🎓 {{ $t("pages.home.section_2.card_1.item_1") }}</li>
            <li>📱 {{ $t("pages.home.section_2.card_1.item_2") }}</li>
            <li>💬 {{ $t("pages.home.section_2.card_1.item_3") }}</li>
            <li>🏆 {{ $t("pages.home.section_2.card_1.item_4") }}</li>
            <li>📺 {{ $t("pages.home.section_2.card_1.item_5") }}</li>
          </ul>

          <nuxt-link
            :to="localePath('/courses')"
            class="btn btn-lg !px-8 btn-primary mx-auto mt-8"
          >
            <i class="pi pi-book"></i>
            {{ $t("pages.courses.go_to_courses") }}
          </nuxt-link>
        </div>
      </div>
      <div class="col-span-12 md:col-span-6">
        <div class="card px-4 lg:px-6 py-12 !rounded-3xl">
          <h2 class="mb-8 text-center">
            {{ $t("pages.home.section_2.card_2.title") }}
          </h2>
          <ul class="px-0 space-y-4 list-none text-lg">
            <li>✅ {{ $t("pages.home.section_2.card_1.item_1") }}</li>
            <li>✅ {{ $t("pages.home.section_2.card_1.item_2") }}</li>
            <li>✅ {{ $t("pages.home.section_2.card_1.item_3") }}</li>
            <li>✅ {{ $t("pages.home.section_2.card_1.item_4") }}</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- <section class="bg-active py-20 px-4 lg:px-20">
    <h2 class="text-3xl  mb-12 text-center">
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
    <h2 class="text-center mb-12">
      {{ $t("pages.home.section_3.title") }}
    </h2>

    <div class="custom-grid">
      <div class="col-span-12 md:col-span-4">
        <div class="card p-4 text-center">
          <h3 class="mb-2">{{ $t("pages.home.section_3.card_1.title") }}</h3>
          <p>
            {{ $t("pages.home.section_3.card_1.description") }}
          </p>
        </div>
      </div>

      <div class="col-span-12 md:col-span-4">
        <div class="card p-4 text-center">
          <h3 class="mb-2">{{ $t("pages.home.section_3.card_2.title") }}</h3>
          <p>
            {{ $t("pages.home.section_3.card_2.description") }}
          </p>
        </div>
      </div>

      <div class="col-span-12 md:col-span-4">
        <div class="card p-4 text-center">
          <h3 class="mb-2">{{ $t("pages.home.section_3.card_3.title") }}</h3>
          <p>
            {{ $t("pages.home.section_3.card_3.description") }}
          </p>
        </div>
      </div>
    </div>
  </section>

  <section id="slider" class="py-16 px-4 lg:px-20 bg-active">
    <h2 class="text-center mb-8">
      {{ $t("pages.home.section_4.title") }}
    </h2>
    <keenSliderThumbs :images="images" />
  </section>

  <section id="demo" class="py-20 px-4 bg-corp text-white text-center">
    <div class="flex flex-col justify-center items-center text-center">
      <h2 class="text-3xl mb-4">
        {{ $t("pages.home.section_5.title") }}
      </h2>
      <p class="text-lg mb-6">
        {{ $t("pages.home.section_5.description") }}
      </p>
      <button
        @click="demoModalIsVisible = true"
        class="btn btn-light btn-lg !px-8"
      >
        {{ $t("pages.home.demo.request_button") }}
      </button>
    </div>
  </section>

  <client-only>
    <modal
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
        <p class="mb-0" v-if="requestIsSended === true">
          {{ $t("pages.home.demo_modal.sended") }}
        </p>
        <template v-else>
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
      </template>
    </modal>
  </client-only>
</template>

<script setup>
import keenSliderThumbs from "../components/ui/keenSliderThumbs.vue";
import Typed from "typed.js";
import { onMounted, onBeforeUnmount, ref } from "vue";
import modal from "../components/ui/modal.vue";
const { t, localeProperties } = useI18n();
const { $axiosPlugin, $contacts } = useNuxtApp();
const demoModalIsVisible = ref(false);
const pendingSend = ref(false);
const requestIsSended = ref(false);
const accept = ref(false);
const errors = ref([]);
const formRef = ref(null);

useHead({
  title: $contacts.name + " - " + t("pages.home.header-title"),
  meta: [{ name: "description", content: t("pages.home.description") }],
});

const showContent = ref(false);
const typedElement = ref();
let typedInstance = null;

const images = [
  "https://1prof.by/wp-content/uploads/2024/10/swiss.jpg",
  "https://avatars.mds.yandex.net/i?id=05f52196e390bf9f34f3754ad5a9d4da_l-8710005-images-thumbs&n=13",
  "https://peterburg2.ru/uploads/24/02/21/o_ray-hennessy-xUUZcpQlqpM-unsplash.jpg",
  "https://informburo.kz/storage/photos/94/main/Oh38ooVAU32ULU9c7rdUWZU2QoP4ojmlHrabANpL.jpg",
  "https://i.pinimg.com/originals/fd/b2/47/fdb247ac713dce8dc8ef3d04cf9881ad.jpg",
  "https://i.pinimg.com/736x/32/22/12/3222126cabf17df67bfded8f5767f8fd.jpg",
];

const sendRequestToDemo = async () => {
  pendingSend.value = true;
  const formData = new FormData(formRef.value);
  formData.append("lang", localeProperties.value.name);
  await $axiosPlugin
    .post("/demo/request", formData)
    .then((res) => {
      requestIsSended.value = true;
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
