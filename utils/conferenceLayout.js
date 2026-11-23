// Подбор раскладки плиток видеоконференции (как в Zoom / Meet):
// перебираем число колонок и выбираем вариант с самыми крупными плитками,
// при котором все плитки помещаются в область width × height без прокрутки.
// Пропорции плитки подстраиваются под свободное место в пределах
// [minRatio, maxRatio] — от вертикальной 3:4 до горизонтальной 16:9.
export const computeTileLayout = (
  count,
  width,
  height,
  { gap = 8, minRatio = 3 / 4, maxRatio = 16 / 9 } = {},
) => {
  if (!count || width <= 0 || height <= 0) return null;

  let best = null;

  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const cellWidth = (width - gap * (cols - 1)) / cols;
    const cellHeight = (height - gap * (rows - 1)) / rows;
    if (cellWidth <= 0 || cellHeight <= 0) continue;

    const ratio = Math.min(maxRatio, Math.max(minRatio, cellWidth / cellHeight));
    const tileWidth = Math.min(cellWidth, cellHeight * ratio);
    const tileHeight = tileWidth / ratio;
    const area = tileWidth * tileHeight;

    // При почти равной площади оставляем вариант с меньшим числом колонок
    if (!best || area > best.area + 1) {
      best = {
        cols,
        rows,
        width: Math.floor(tileWidth),
        height: Math.floor(tileHeight),
        area,
      };
    }
  }

  return best;
};
