import { ref, watch, onBeforeUnmount, unref } from "vue";

// Общее на всё приложение: одновременно играет только одна кнопка-аудио.
// (Раньше эта переменная объявлялась внутри <script setup> и была своя у
// каждой кнопки, поэтому «остановить другое аудио» не работало.)
let currentAudio = null;

/**
 * Кнопка «послушать»: ленивое создание Audio, одна активная дорожка,
 * состояния загрузки/ошибки, синхронизация с паузой «извне».
 * @param {import('vue').Ref<string>|string} srcRef
 */
export const useAudioToggle = (srcRef) => {
  const isPlaying = ref(false);
  const isLoading = ref(false);
  const hasError = ref(false);

  let audio = null;

  const onPlay = () => {
    isPlaying.value = true;
  };
  // Пауза может прийти и от другого плеера — кнопка обязана это увидеть
  const onPause = () => {
    isPlaying.value = false;
    isLoading.value = false;
  };
  const onEnded = () => {
    isPlaying.value = false;
    if (currentAudio === audio) currentAudio = null;
  };
  const onWaiting = () => {
    isLoading.value = true;
  };
  const onPlaying = () => {
    isLoading.value = false;
  };
  const onError = () => {
    isLoading.value = false;
    isPlaying.value = false;
    hasError.value = true;
  };

  const events = {
    play: onPlay,
    pause: onPause,
    ended: onEnded,
    waiting: onWaiting,
    playing: onPlaying,
    error: onError,
  };

  const destroyAudio = () => {
    if (!audio) return;
    audio.pause();
    Object.entries(events).forEach(([name, fn]) =>
      audio.removeEventListener(name, fn),
    );
    if (currentAudio === audio) currentAudio = null;
    audio = null;
  };

  // Audio создаётся только при первом нажатии — не грузим десятки файлов
  // заранее (например, в словаре)
  const ensureAudio = () => {
    if (audio) return audio;
    audio = new Audio(unref(srcRef));
    audio.preload = "auto";
    Object.entries(events).forEach(([name, fn]) =>
      audio.addEventListener(name, fn),
    );
    return audio;
  };

  const toggle = async () => {
    if (typeof window === "undefined") return;

    if (isPlaying.value && audio) {
      audio.pause();
      return;
    }

    hasError.value = false;
    const el = ensureAudio();

    if (currentAudio && currentAudio !== el) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    currentAudio = el;

    isLoading.value = el.readyState < 3; // ещё нечего играть
    try {
      await el.play();
    } catch (e) {
      // AbortError — воспроизведение прервали паузой, это не ошибка
      if (e?.name !== "AbortError") onError();
    }
  };

  // Сменился файл — сбрасываем плеер
  watch(
    () => unref(srcRef),
    () => {
      destroyAudio();
      isPlaying.value = false;
      isLoading.value = false;
      hasError.value = false;
    },
  );

  onBeforeUnmount(destroyAudio);

  return { isPlaying, isLoading, hasError, toggle };
};
