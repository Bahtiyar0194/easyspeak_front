import { watch } from "vue";

// Общий статус видеоконференций. Опрашивает его layouts/dashboard.vue
// (эндпоинт conferences/live_status), а страницы только подписываются —
// так на всё приложение один лёгкий запрос раз в 30 секунд.
//
// live — идёт ли сейчас конференция (зелёная точка в меню);
// key  — ключ набора «текущих» конференций (null — ещё ни разу не проверяли).
// notificationsUnread — непрочитанные уведомления (колокольчик) тем же опросом.
export const useConferenceLive = () =>
  useState("conferenceLive", () => ({ live: false, key: null, notificationsUnread: 0 }));

// Внеочередная проверка — вызывать после действий, которые меняют текущие
// конференции: создание, удаление, перенос. Счётчик слушает layouts/dashboard.vue
// и сразу запрашивает статус, не дожидаясь очередного 30-секундного опроса.
export const useConferenceLiveCheck = () =>
  useState("conferenceLiveCheck", () => 0);

export const checkConferenceLiveNow = () => {
  useConferenceLiveCheck().value++;
};

// Вызывает callback, когда набор текущих конференций изменился:
// урок начался (открылся вход), закончился, перенесён, создан или удалён.
// Первая проверка после загрузки не считается — страница и так свежая.
export const onConferencesChanged = (callback) => {
  const status = useConferenceLive();

  watch(
    () => status.value.key,
    (newKey, oldKey) => {
      if (oldKey === null || newKey === null) return;
      callback();
    },
  );
};
