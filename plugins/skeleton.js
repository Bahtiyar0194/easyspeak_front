import { defineNuxtPlugin } from "nuxt/app";

// Директива v-skeleton — скелетон, пока <img> не загрузилась.
//
//   <img v-skeleton :src="..." class="w-full" />             — плашка 4:3
//   <img v-skeleton="'1/1'" :src="..." class="w-36" />       — квадратная плашка
//   <img v-skeleton.parent :src="..." />                     — перелив на
//        родительском блоке (когда у блока уже есть размер и фон, напр. постер)
//
// Пока картинка грузится, у неё нет собственного размера, поэтому плашка
// берёт ширину из классов картинки, а высоту — из пропорции (значение
// директивы). После загрузки (или ошибки) класс снимается, и картинка плавно
// появляется. При смене src скелетон показывается снова.

const IMG_CLASS = "img-loading";
const PARENT_CLASS = "skeleton-parent";

const targetOf = (el, binding) =>
  binding.modifiers.parent ? el.parentElement : el;

const finish = (el) => {
  const st = el._skeleton;
  if (!st || !st.target?.classList.contains(st.cls)) return;
  st.target.classList.remove(st.cls);
  if (st.cls !== IMG_CLASS) return;
  // Плавное появление — только если скелетон действительно был виден.
  el.classList.add("img-fade-in");
  el.addEventListener(
    "animationend",
    () => el.classList.remove("img-fade-in"),
    { once: true },
  );
};

const start = (el, binding) => {
  const st = el._skeleton;
  st.src = el.getAttribute("src");
  st.target = targetOf(el, binding);
  st.cls = binding.modifiers.parent ? PARENT_CLASS : IMG_CLASS;

  if (binding.value) el.style.setProperty("--sk-ratio", binding.value);

  // Уже в кэше / загружена до гидрации — скелетон не нужен.
  if (!st.src || (el.complete && el.naturalWidth > 0)) {
    finish(el);
    return;
  }
  st.target?.classList.add(st.cls);
};

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive("skeleton", {
    // На сервере ничего не добавляем — всё решается на клиенте.
    getSSRProps: () => ({}),

    mounted(el, binding) {
      const onDone = () => finish(el);
      el._skeleton = { onDone };
      el.addEventListener("load", onDone);
      el.addEventListener("error", onDone);
      start(el, binding);
    },

    updated(el, binding) {
      if (el._skeleton && el.getAttribute("src") !== el._skeleton.src) {
        start(el, binding);
      }
    },

    beforeUnmount(el) {
      const st = el._skeleton;
      if (!st) return;
      el.removeEventListener("load", st.onDone);
      el.removeEventListener("error", st.onDone);
      st.target?.classList.remove(st.cls);
      delete el._skeleton;
    },
  });
});
