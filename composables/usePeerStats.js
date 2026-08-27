// usePeerStats.js
export function startNetworkMonitoring(mediaConnection, onStats) {
    let prevBytesReceived = 0;
    let prevTimestamp = Date.now();

    const intervalId = setInterval(async () => {
        const pc = mediaConnection?.peerConnection;
        if (!pc || pc.connectionState !== 'connected') return;

        const stats = await pc.getStats();
        let currentRtt = 0; // Пинг (мс)
        let packetsLost = 0; // Потеряно пакетов
        let packetsReceived = 0;
        let bitrate = 0; // Скорость (kbps)

        stats.forEach((report) => {
            // 1. Измеряем Задержку (RTT / Ping)
            if ((report.type === 'candidate-pair' && report.state === 'in-progress') || report.currentRoundTripTime) {
                if (report.currentRoundTripTime) {
                    currentRtt = Math.round(report.currentRoundTripTime * 1000); // Переводим в мс
                }
            }

            // 2. Измеряем Потери пакетов и Битрейт входящего аудио/видео
            if (report.type === 'inbound-rtp' && (report.kind === 'audio' || report.kind === 'video')) {
                packetsLost += report.packetsLost || 0;
                packetsReceived += report.packetsReceived || 0;

                // Расчет входящей скорости (kbps)
                const now = report.timestamp;
                const bytes = report.bytesReceived || 0;
                const timeDiff = now - prevTimestamp;

                // Считаем битрейт только если прошло хотя бы больше 0 мс
                if (prevBytesReceived > 0 && timeDiff > 0) {
                    const calculatedBitrate = Math.round(((bytes - prevBytesReceived) * 8) / timeDiff);
                    // Защита от Infinity и NaN
                    bitrate = isFinite(calculatedBitrate) ? calculatedBitrate : 0;
                }

                prevBytesReceived = bytes;
                prevTimestamp = now;
            }
        });

        // Расчет процента потерь
        const totalPackets = packetsLost + packetsReceived;
        const lossPercentage = totalPackets > 0 ? ((packetsLost / totalPackets) * 100).toFixed(1) : 0;

        // Возвращаем обработанные данные
        onStats({
            rtt: currentRtt,
            lossPercentage: Number(lossPercentage),
            bitrate: bitrate > 0 ? bitrate : 0, // в kbps
            quality: getQualityScore(currentRtt, Number(lossPercentage))
        });

    }, 2000); // Проверка каждые 2 секунды

    // Функция для остановки мониторинга при завершении звонка
    return () => clearInterval(intervalId);
}

// Оценка качества по шкале (Good / Fair / Bad)
function getQualityScore(rtt, loss) {
    if (rtt < 150 && loss < 2) return 'excellent';
    if (rtt < 300 && loss < 5) return 'good';
    if (rtt < 500 || loss < 10) return 'poor';
    return 'bad';
}