let currentWave = null;

export function setCurrentWave(wave) {
    // если уже есть активный — останавливаем
    if (currentWave && currentWave !== wave) {
        currentWave.pause();
    }

    currentWave = wave;
}

export function clearCurrentWave(wave) {
    if (currentWave === wave) {
        currentWave = null;
    }
}