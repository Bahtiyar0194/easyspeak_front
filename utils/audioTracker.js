// utils/audioTracker.js
const activeAudios = new Set();

// Перехватываем метод play у всех аудио
const originalPlay = HTMLAudioElement.prototype.play;

HTMLAudioElement.prototype.play = function () {
    // Останавливаем все ранее созданные аудио
    activeAudios.forEach(audio => {
        if (audio !== this) {
            audio.pause();
        }
    });

    activeAudios.add(this);
    return originalPlay.apply(this, arguments);
};

export const stopAllAudios = () => {
    activeAudios.forEach(audio => audio.pause());
};