let audio = null;

export function playAudio(url) {
    // Если аудио уже играет, останавливаем его перед воспроизведением нового
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }

    audio = new Audio(url); // Создаем новый объект Audio
    audio.play()
}

export function pauseAudio() {
    if (audio) {
        audio.pause();
    }
}

export function stopAudio() {
    if (audio) {
        audio.pause();
        audio.currentTime = 0; // Сбрасываем аудио на начало
    }
}