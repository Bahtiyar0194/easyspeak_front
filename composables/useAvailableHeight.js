import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";

// Высота, доступная элементу от его верхнего края до нижней панели кнопок
// конференции (.db__footer__menu) — чтобы участники помещались на экран
// без прокрутки. Пересчитывается при изменении размера окна и повороте экрана.
export const useAvailableHeight = (
  elRef,
  { minHeight = 240, bottomGap = 12 } = {},
) => {
  const height = ref(minHeight);
  let frame = null;

  const measure = () => {
    const el = elRef.value;
    if (!el) return;

    // Расстояние от верха страницы при прокрутке в самое начало
    const scroller = el.closest(".db__content");
    const top =
      el.getBoundingClientRect().top +
      (scroller ? scroller.scrollTop : window.scrollY);

    const footer = document.querySelector(".db__footer__menu");
    const footerHeight = footer ? footer.offsetHeight : 0;

    height.value = Math.max(
      minHeight,
      Math.floor(window.innerHeight - top - footerHeight - bottomGap),
    );
  };

  const update = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(measure);
  };

  onMounted(() => {
    nextTick(measure);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", update);
    window.removeEventListener("orientationchange", update);
  });

  return { height, update };
};
