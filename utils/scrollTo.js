export const scrollTo = (id, headerOffset) => {
  const el = document.getElementById(id);
  if (el) {
    const elementPosition = el.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }
};