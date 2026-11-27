import { onMounted, onBeforeUnmount } from "vue";

// Продолжение прокрутки у родителя, когда внутренний блок упёрся в край.
//
// Браузер передаёт прокрутку колесом наружу только в новом жесте: пока колесо
// крутится, оно «закреплено» за внутренним блоком, и приходилось выводить
// курсор наружу. Здесь, если блок уже у верхнего / нижнего края и крутят в ту
// же сторону, прокручиваем ближайшего прокручиваемого родителя сразу.
// Тач-прокрутку браузер передаёт сам (overscroll-behavior-y: auto в CSS).
//
//   const el = ref(null);
//   useScrollChain(el);

const LINE_HEIGHT = 16;

const canScrollY = (node) => {
  const { overflowY } = getComputedStyle(node);
  return (
    /(auto|scroll|overlay)/.test(overflowY) &&
    node.scrollHeight > node.clientHeight + 1
  );
};

const canMove = (node, deltaY) =>
  deltaY < 0
    ? node.scrollTop > 0
    : node.scrollTop + node.clientHeight < node.scrollHeight - 1;

// Ближайший предок, который ещё может прокрутиться в эту сторону (если
// родитель сам упёрся — отдаём дальше); в конце — сама страница
const findScrollParent = (el, deltaY) => {
  let node = el?.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    if (canScrollY(node) && canMove(node, deltaY)) return node;
    node = node.parentElement;
  }
  const root = document.scrollingElement || document.documentElement;
  return root && canMove(root, deltaY) ? root : null;
};

export const useScrollChain = (elRef) => {
  const onWheel = (e) => {
    const el = elRef.value;
    // ctrl + колесо — масштаб страницы; горизонтальную прокрутку не трогаем
    if (!el || e.ctrlKey || e.defaultPrevented) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

    // Сам блок не прокручивается — браузер и так отдаст прокрутку наружу
    if (el.scrollHeight <= el.clientHeight + 1) return;

    // Колесо над вложенным прокручиваемым элементом (таблица, textarea),
    // который ещё может прокрутиться, — пусть прокручивается он
    for (let node = e.target; node && node !== el; node = node.parentElement) {
      if (node instanceof Element && canScrollY(node) && canMove(node, e.deltaY)) {
        return;
      }
    }

    // Блок ещё может прокрутиться в эту сторону — обычная прокрутка
    if (canMove(el, e.deltaY)) return;

    const parent = findScrollParent(el, e.deltaY);
    if (!parent) return;

    let delta = e.deltaY;
    if (e.deltaMode === 1) delta *= LINE_HEIGHT;
    else if (e.deltaMode === 2) delta *= parent.clientHeight;

    e.preventDefault();
    parent.scrollBy({ top: delta, behavior: "auto" });
  };

  onMounted(() => {
    elRef.value?.addEventListener("wheel", onWheel, { passive: false });
  });

  onBeforeUnmount(() => {
    elRef.value?.removeEventListener("wheel", onWheel);
  });
};
