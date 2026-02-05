let audio = null;

export function playAudio(url, onEnded = () => { }) {
    // Если аудио уже играет, останавливаем его перед воспроизведением нового
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }

    audio = new Audio(url); // Создаем новый объект Audio
    audio.play().catch(error => {
        console.error('Ошибка при воспроизведении аудиофайла:', error);
    });

    audio.onended = () => {
        audio = null
        onEnded() // Это коллбэк при остановке аудио playAudio(url, () => {тут код})
    }
}

export function pauseAudio() {
    if (audio) {
        audio.pause();
    }
}

export function resumeAudio() {
    if (audio) {
        audio.play();
    }
}

export function backward() {
    if (audio) {
        audio.pause();
        audio.currentTime = 0; // Сбрасываем аудио на начало
        audio.play();
    }
}

export function stopAudio() {
    if (audio) {
        audio.pause();
        audio.currentTime = 0; // Сбрасываем аудио на начало
    }
}

export function playSuccessSound(url) {
    // Если аудио уже играет, останавливаем его перед воспроизведением нового
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }

    audio = new Audio('/audio/right-answer.mp3'); // Создаем новый объект Audio
    audio.play().then(() => {
        setTimeout(() => {
            const secondAudio = new Audio(url);
            secondAudio.play().catch(error => {
                console.error('Ошибка при воспроизведении аудиофайла:', error);
            });
        }, 300);
    }).catch(error => {
        console.error('Ошибка при воспроизведении аудиофайла:', error);
    });
}

export function playErrorSound() {
    // Если аудио уже играет, останавливаем его перед воспроизведением нового
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }

    audio = new Audio('/audio/error-short.mp3'); // Создаем новый объект Audio
    audio.play().catch(error => {
        console.error('Ошибка при воспроизведении аудиофайла:', error);
    });
}