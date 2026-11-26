import { reactive } from "vue";

// Общее состояние окна подтверждения. Само окно (components/ui/confirmDialog.vue)
// подключено один раз в layout'ах, а вызывать его можно из любого компонента:
//
//   const confirm = useConfirm();
//   if (await confirm({ message: t("..."), danger: true, confirmText: t("delete") })) {
//     ...
//   }
//
// Можно передать просто строку: await confirm(t("..."))
export const confirmState = reactive({
  show: false,
  title: "",
  message: "",
  confirmText: "",
  cancelText: "",
  danger: false,
  resolve: null,
});

export const settleConfirm = (result) => {
  const resolve = confirmState.resolve;
  confirmState.resolve = null;
  confirmState.show = false;
  if (resolve) resolve(result);
};

export const useConfirm = () => (options) =>
  new Promise((resolve) => {
    const opts = typeof options === "string" ? { message: options } : options || {};
    // Если предыдущее окно ещё открыто — считаем его отменённым.
    if (confirmState.resolve) settleConfirm(false);
    Object.assign(confirmState, {
      title: opts.title || "",
      message: opts.message || "",
      confirmText: opts.confirmText || "",
      cancelText: opts.cancelText || "",
      danger: !!opts.danger,
      resolve,
      show: true,
    });
  });
