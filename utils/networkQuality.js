// Получение скорости сети (downlink) из объекта Network Information API
const getNetworkSpeed = () => {
    const networkInfo = navigator?.connection || navigator?.mozConnection || navigator?.webkitConnection;
    if (networkInfo && networkInfo.downlink) {
        return networkInfo.downlink; // Возвращает скорость загрузки в Мбит/с
    }
    return null;
};

// Функция для мониторинга сетевых условий и адаптации качества видео
const monitorNetworkAndAdjustQuality = (peer) => {
    setInterval(() => {
        const connection = peer.connections[Object.keys(peer.connections)[0]];
        if (connection && connection[0]) {
            const sender = connection[0].peerConnection.getSenders().find(s => s.track.kind === 'video');
            if (sender) {
                adjustVideoQuality(sender);
            }
        }
    }, 5000); // Проверка каждые 5 секунд
};

// Функция для адаптации качества видео в зависимости от параметров сети
const adjustVideoQuality = (sender) => {
    const networkSpeed = getNetworkSpeed();
    let constraints;

    if (networkSpeed) {
        if (networkSpeed > 3) {
            constraints = {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 },
                bitrate: 2500 * 1000
            };
        } else if (networkSpeed > 1.5) {
            constraints = {
                width: { ideal: 854 },
                height: { ideal: 480 },
                frameRate: { ideal: 24 },
                bitrate: 1500 * 1000
            };
        } else if (networkSpeed > 0.8) {
            constraints = {
                width: { ideal: 640 },
                height: { ideal: 360 },
                frameRate: { ideal: 15 },
                bitrate: 800 * 1000
            };
        } else {
            constraints = {
                width: { ideal: 320 },
                height: { ideal: 240 },
                frameRate: { ideal: 10 },
                bitrate: 300 * 1000
            };
        }
    } else {
        // Если нет данных о скорости сети, устанавливаем среднее качество
        constraints = {
            width: { ideal: 854 },
            height: { ideal: 480 },
            frameRate: { ideal: 24 },
            bitrate: 1500 * 1000
        };
    }

    // Обновление параметров отправки видео
    const parameters = sender.getParameters();
    if (!parameters.encodings) {
        parameters.encodings = [{}];
    }
    parameters.encodings[0].maxBitrate = constraints.bitrate;
    sender.setParameters(parameters);
};

export {
    getNetworkSpeed,
    monitorNetworkAndAdjustQuality,
    adjustVideoQuality
};