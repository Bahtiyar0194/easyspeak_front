export function normalizeQuotes(str) {
    return str
        .replace(/[\u2019\u2018\u201B]/g, "'")     // ’ ‘ ‛ → '
        .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // “ ” „ ‟ → "
        .replace(/[«»]/g, '"')                     // « » → "
        .replace(/[—–]/g, '-')                     // длинное и короткое тире → -
        .replace(/[\u00A0]|&nbsp;| /g, ' ')        // неразрывный пробел (включая обычный символ и HTML)
        .replace(/\s+/g, ' ')                      // множественные пробелы → один
        .trim();                                   // убрать пробелы по краям
}