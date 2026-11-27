import { ref, reactive } from "vue";
import { useNotify } from "~/composables/useNotify";

// Автоперевод для словаря и фраз (openai/translate): транскрипция и переводы
// на казахский и русский.
//
//   const auto = useAutoTranslate({ transcription: true });
//   auto.markManual("kk")                   — поле поправили вручную
//   auto.translate(text, (result) => {...}) — заполнит только НЕ ручные поля
//   auto.translate(text, apply, { force: true }) — «Перевести заново»: все поля
//   auto.reset()                            — форма закрыта / очищена
//
// Защита от гонок: если текст поменяли, пока шёл запрос, старый ответ
// отбрасывается. Ошибка перевода — уведомление, а не переход на /error:
// введённое в форму не теряется.
const FIELDS = ["transcription", "kk", "ru"];

export const useAutoTranslate = ({ transcription = false } = {}) => {
  const { $axiosPlugin } = useNuxtApp();
  const { t } = useI18n();
  const notify = useNotify();

  const translating = ref(false);
  const manual = reactive(new Set());
  let requestId = 0;

  const markManual = (key) => manual.add(key);

  const reset = () => {
    requestId++;
    manual.clear();
    translating.value = false;
  };

  const translate = async (text, apply, { force = false } = {}) => {
    const value = String(text || "").trim();
    if (!value) return;

    const id = ++requestId;
    translating.value = true;

    try {
      const params = { text: value };
      if (transcription) params.transcription = true;

      const { data } = await $axiosPlugin.get("openai/translate", { params });
      if (id !== requestId) return;

      if (force) manual.clear();

      const result = {};
      for (const key of FIELDS) {
        if (data?.[key] != null && !manual.has(key)) result[key] = data[key];
      }
      apply(result);
    } catch (err) {
      if (id !== requestId) return;
      notify(
        "warning",
        err?.response?.status === 422 && err.response.data?.message
          ? err.response.data.message
          : t("auto_translate.failed"),
      );
    } finally {
      if (id === requestId) translating.value = false;
    }
  };

  return { translating, manual, markManual, translate, reset };
};
