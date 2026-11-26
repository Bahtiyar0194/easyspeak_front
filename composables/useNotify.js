import { useToast } from "vue-toastification";

// Единые длительности показа по типу уведомления (мс).
export const NOTIFY_TIMEOUTS = {
  success: 5000,
  info: 7000,
  warning: 10000,
  danger: 10000,
};

// Иконка по типу уведомления (PrimeIcons). Свою можно передать в options.icon.
export const NOTIFY_ICONS = {
  success: "pi pi-check-circle",
  info: "pi pi-info-circle",
  warning: "pi pi-exclamation-triangle",
  danger: "pi pi-times-circle",
};

// Классы тоста: тип задаёт цвет (стили — .custom-toast в main.css)
export const notifyClasses = (type, clickable = false) => [
  "custom-toast",
  type,
  ...(clickable ? ["clickable"] : []),
];

// Уведомления, которые сейчас на экране: ключ -> id тоста.
const activeToasts = new Map();

// Единый способ показать уведомление в стиле приложения:
//
//   const notify = useNotify();
//   notify("success", t("saved"));
//   notify("danger", message, { timeout: 15000 });
//
// type: "success" | "info" | "warning" | "danger".
// Одинаковое уведомление (тот же type + текст, или тот же options.key) не
// дублируется, пока предыдущее ещё видно. Остальные options передаются в
// vue-toastification как есть (onClick, closeOnClick и т.п.).
export const useNotify = () => {
  const toast = useToast();

  return (type, message, options = {}) => {
    const { key = `${type}:${message}`, timeout, onClose, ...rest } = options;
    if (activeToasts.has(key)) return activeToasts.get(key);

    const id = toast(message, {
      toastClassName: notifyClasses(type, Boolean(rest.onClick)),
      icon: NOTIFY_ICONS[type] ?? NOTIFY_ICONS.info,
      timeout: timeout ?? NOTIFY_TIMEOUTS[type] ?? NOTIFY_TIMEOUTS.info,
      ...rest,
      onClose: () => {
        activeToasts.delete(key);
        if (onClose) onClose();
      },
    });
    activeToasts.set(key, id);
    return id;
  };
};
