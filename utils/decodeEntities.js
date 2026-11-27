// Названия школ при регистрации сохраняются через e() в Laravel, поэтому в базе
// лежит «ТОО &quot;School&quot;». Раньше их выводили через v-html — это давало
// XSS, если в названии окажется разметка. Здесь превращаем сущности обратно в
// символы и выводим результат как обычный текст ({{ }}), без интерпретации HTML.
const NAMED = {
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
  laquo: "«",
  raquo: "»",
  ndash: "–",
  mdash: "—",
};

export function decodeEntities(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
    (match, entity) => {
      if (entity[0] === "#") {
        const code =
          entity[1] === "x" || entity[1] === "X"
            ? parseInt(entity.slice(2), 16)
            : parseInt(entity.slice(1), 10);
        return Number.isFinite(code) && code > 0 && code <= 0x10ffff
          ? String.fromCodePoint(code)
          : match;
      }
      const named = NAMED[entity.toLowerCase()];
      return named !== undefined ? named : match;
    },
  );
}
