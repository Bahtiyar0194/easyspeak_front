import { ref, shallowRef, computed, watch } from "vue";
import dayjs from "dayjs";

// Помесячная загрузка расписания для components/schedule/scheduleGrid.vue.
//
//   const loader = useScheduleLoader({
//     getFormData: () => new FormData(searchFormRef.value), // фильтры
//     onError: (err) => router.push("/error"),
//   });
//
//   <scheduleGrid
//     :schedule="loader.schedule.value"
//     :pendingSchedule="loader.pending.value"
//     :rangeLoaded="loader.hasData.value"
//     :monthCounts="loader.monthCounts.value"
//     @range="loader.setRange"
//   />
//
//   loader.refresh()  — фильтр изменился / урок перенесён или удалён
//
// Календарь сообщает видимый период (@range): месяцы ("YYYY-MM") и год.
// Грузим только недостающие месяцы (schedule/get с from/to), для режима «Год» —
// 12 счётчиков (schedule/month_counts). Загруженные месяцы кэшируются, соседние
// подгружаются заранее — перелистывание обычно мгновенное.
//
// refresh() сбрасывает кэш, но пока не пришли свежие данные, календарь
// показывает прежние (с переливом), а не пустой скелетон.

const monthRange = (key) => {
  const from = dayjs(key + "-01");
  return {
    from: from.format("YYYY-MM-DD"),
    to: from.add(1, "month").format("YYYY-MM-DD"),
  };
};

const shiftMonth = (key, n) =>
  dayjs(key + "-01").add(n, "month").format("YYYY-MM");

// Запрос уходит, только когда пользователь остановился на периоде: быстрое
// перелистывание (‹ › подряд) не порождает запрос на каждый месяц
const LOAD_DELAY = 250;

// 429 (лимит запросов API): ждём, сколько просит сервер (Retry-After),
// а если заголовок недоступен — нарастающие паузы, и повторяем
const RETRY_BACKOFF_MS = [2000, 5000, 10000];
const MAX_RETRIES = RETRY_BACKOFF_MS.length;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retryDelay = (err, attempt) => {
  const seconds = Number(err?.response?.headers?.["retry-after"]);
  return Number.isFinite(seconds) && seconds > 0
    ? seconds * 1000
    : RETRY_BACKOFF_MS[attempt];
};

export const useScheduleLoader = ({
  getFormData = () => new FormData(),
  onError = null,
} = {}) => {
  const { $axiosPlugin } = useNuxtApp();

  // Свежие данные: месяц → уроки, год → 12 счётчиков
  const months = shallowRef(new Map());
  const counts = shallowRef(new Map());
  // Прежние данные на время refresh()
  const stale = shallowRef(null);

  const range = ref({ months: [], year: null, mode: null });

  // Поколение: после refresh() ответы на старые запросы не записываются
  let generation = 0;
  const inflight = new Map();

  const covers = (store, r) =>
    r.mode !== null &&
    r.months.every((key) => store.months.has(key)) &&
    (r.mode !== "year" || store.counts.has(r.year));

  // Видимый период загружен свежими данными
  const rangeLoaded = computed(() =>
    covers({ months: months.value, counts: counts.value }, range.value),
  );

  // Есть что показать: свежие данные или прежние на время обновления
  const staleCovers = computed(
    () => !rangeLoaded.value && stale.value && covers(stale.value, range.value),
  );

  const view = computed(() =>
    staleCovers.value
      ? stale.value
      : { months: months.value, counts: counts.value },
  );

  const schedule = computed(() => [...view.value.months.values()].flat());

  const monthCounts = computed(
    () => view.value.counts.get(range.value.year) || null,
  );

  const pending = computed(() => range.value.mode !== null && !rangeLoaded.value);
  const hasData = computed(() => rangeLoaded.value || Boolean(staleCovers.value));

  // Свежие данные для видимого периода пришли — прежние больше не нужны
  watch(rangeLoaded, (loaded) => {
    if (loaded) stale.value = null;
  });

  const request = (id, makePromise) => {
    if (inflight.has(id)) return inflight.get(id);
    const promise = makePromise().finally(() => inflight.delete(id));
    inflight.set(id, promise);
    return promise;
  };

  const fetchMonth = (key) => {
    const gen = generation;
    return request(`${gen}:m:${key}`, () => {
      const formData = getFormData();
      const { from, to } = monthRange(key);
      formData.append("from", from);
      formData.append("to", to);

      return $axiosPlugin.post("schedule/get", formData).then((response) => {
        if (gen !== generation) return;
        const next = new Map(months.value);
        next.set(key, response.data);
        months.value = next;
      });
    });
  };

  const fetchCounts = (year) => {
    const gen = generation;
    return request(`${gen}:y:${year}`, () => {
      const formData = getFormData();
      formData.append("year", year);

      return $axiosPlugin
        .post("schedule/month_counts", formData)
        .then((response) => {
          if (gen !== generation) return;
          const next = new Map(counts.value);
          next.set(year, response.data);
          counts.value = next;
        });
    });
  };

  // Соседние месяцы — тихо, ошибки не показываем
  const prefetch = () => {
    const r = range.value;
    if (!r.months.length) return;
    const neighbours = [
      shiftMonth(r.months[0], -1),
      shiftMonth(r.months[r.months.length - 1], 1),
    ];
    neighbours
      .filter((key) => !months.value.has(key))
      .forEach((key) => fetchMonth(key).catch(() => {}));
  };

  // silent — фоновое обновление: ошибки не показываем
  const load = async ({ silent = false } = {}, attempt = 0) => {
    const r = range.value;
    if (r.mode === null) return;

    const jobs = r.months
      .filter((key) => !months.value.has(key))
      .map(fetchMonth);

    if (r.mode === "year" && !counts.value.has(r.year)) {
      jobs.push(fetchCounts(r.year));
    }

    try {
      await Promise.all(jobs);
      if (range.value === r) prefetch();
    } catch (err) {
      // Лимит запросов — не ошибка: подождать и повторить (если период
      // всё ещё на экране), без перехода на страницу ошибки
      if (err?.response?.status === 429 && attempt < MAX_RETRIES) {
        await sleep(retryDelay(err, attempt));
        if (range.value === r) await load({ silent }, attempt + 1);
        return;
      }

      if (onError && !silent) onError(err);
    }
  };

  let loadTimer = null;

  // Календарь сообщил видимый период. Загруженное показывается сразу
  // (из кэша), запрос — после паузы LOAD_DELAY
  const setRange = (next) => {
    const same =
      range.value.mode === next.mode &&
      range.value.year === next.year &&
      range.value.months.join() === next.months.join();
    if (same) return;

    const first = range.value.mode === null;
    range.value = { months: [...next.months], year: next.year, mode: next.mode };

    clearTimeout(loadTimer);
    // Первую загрузку не задерживаем
    if (first) load();
    else loadTimer = setTimeout(() => load(), LOAD_DELAY);
  };

  // Данные изменились (фильтр, перенос, удаление) — грузим заново,
  // а до ответа показываем прежние
  const refresh = async ({ silent = false } = {}) => {
    clearTimeout(loadTimer);
    generation++;
    stale.value = { months: months.value, counts: counts.value };
    months.value = new Map();
    counts.value = new Map();
    await load({ silent });
  };

  return {
    schedule,
    monthCounts,
    pending,
    hasData,
    setRange,
    refresh,
  };
};
