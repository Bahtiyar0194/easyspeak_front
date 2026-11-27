import { defineAsyncComponent, ref } from "vue";

// Компоненты заданий (create / edit / execution) грузятся отдельными файлами.
// Раньше файл начинал скачиваться только по клику, и окно задания пару секунд
// было пустым. Здесь:
//  - loadTaskComponent — компонент для <component :is>; повторная загрузка
//    того же файла берётся из кэша мгновенно;
//  - prefetchTaskComponents — заранее, в свободное время браузера, скачивает
//    компоненты типов заданий, которые есть на экране;
//  - prefetchTaskComponent — сразу (наведение / фокус на задании).
//
// Ключи glob — относительные пути от этого файла.
const loaders = import.meta.glob("../components/lesson/components/tasks/actions/*/*.vue");

const keyOf = (action, component) =>
  `../components/lesson/components/tasks/actions/${action}/${component}.vue`;

// Промис загрузки на каждый файл — чтобы не качать дважды
const started = new Map();

const load = (action, component) => {
  const key = keyOf(action, component);
  const loader = loaders[key];
  if (!loader) return Promise.reject(new Error(`Task component not found: ${key}`));
  if (!started.has(key)) {
    const promise = loader().catch((err) => {
      // Ошибка сети — дадим попробовать снова при следующем открытии
      started.delete(key);
      throw err;
    });
    started.set(key, promise);
  }
  return started.get(key);
};

export const loadTaskComponent = (action, component) =>
  defineAsyncComponent(() => load(action, component));

export const prefetchTaskComponent = (action, component) => {
  if (!component) return;
  load(action, component).catch(() => {});
};

const whenIdle = (fn) => {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) window.requestIdleCallback(fn, { timeout: 3000 });
  else setTimeout(fn, 300);
};

export const prefetchTaskComponents = (action, components = []) => {
  const unique = [...new Set(components.filter(Boolean))];
  if (!unique.length) return;
  whenIdle(() => unique.forEach((component) => prefetchTaskComponent(action, component)));
};

// Состояние «задание открывается»: скелетон, пока не пришли данные задания.
// Компонент задания при загрузке вызывает onPending(true) → запрос →
// onPending(false); первый onPending(false) после открытия убирает скелетон.
// Формы без начального запроса (создание) не вызывают onPending — тогда
// скелетон убирается сразу после монтирования (handleMounted).
export const useTaskBooting = () => {
  const booting = ref(false);
  let pendingSeen = false;

  const start = () => {
    booting.value = true;
    pendingSeen = false;
  };

  // true — событие поглощено скелетоном (не показывать общий лоадер)
  const handlePending = (state) => {
    if (!booting.value) return false;
    if (state) pendingSeen = true;
    else booting.value = false;
    return true;
  };

  const handleMounted = () => {
    setTimeout(() => {
      if (!pendingSeen) booting.value = false;
    }, 0);
  };

  const stop = () => {
    booting.value = false;
  };

  return { booting, start, handlePending, handleMounted, stop };
};
