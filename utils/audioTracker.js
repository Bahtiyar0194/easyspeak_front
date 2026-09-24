// utils/audioTracker.js
const activeAudios = new Set();

// Выполняем прототипирование только на клиенте
if (import.meta.client) {
    const originalPlay = HTMLAudioElement.prototype.play;

    HTMLAudioElement.prototype.play = function (...args) {
        // Останавливаем все ранее созданные аудио
        activeAudios.forEach(audio => {
            if (audio !== this) {
                audio.pause();
            }
        });

        activeAudios.add(this);
        // Удаляем элемент из отслеживания, когда проигрывание завершилось
        this.addEventListener('ended', () => {
            activeAudios.delete(this);
        }, { once: true });

        return originalPlay.apply(this, args);
    };
}

export const stopAllAudios = () => {
    if (import.meta.client) {
        activeAudios.forEach(audio => audio.pause());
    }
};