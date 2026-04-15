export function useAudioRecorder() {
    let mediaRecorder = null;
    let audioChunks = [];
    let stream = null;

    const getSupportedMimeType = () => {
        const types = [
            'audio/webm;codecs=opus', // Chrome / Android
            'audio/webm',
            'audio/mp4',              // iOS Safari
            'audio/aac',
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return '';
    };

    const startRecording = async () => {
        if (!process.client) return;

        stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const mimeType = getSupportedMimeType();

        mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                audioChunks.push(e.data);
            }
        };

        // важно для iOS
        mediaRecorder.start(100);
    };

    const stopRecording = () => {
        return new Promise((resolve) => {
            if (!mediaRecorder) return resolve(null);

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunks, {
                    type: mediaRecorder.mimeType || 'audio/mp4',
                });

                // остановить микрофон
                if (stream) {
                    stream.getTracks().forEach(t => t.stop());
                }

                resolve(blob);
            };

            mediaRecorder.stop();
        });
    };

    const isSilentBlob = async (blob, threshold = 0.01) => {
        try {
            if (!blob || blob.size === 0) return true;

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const arrayBuffer = await blob.arrayBuffer();

            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            let sum = 0;
            let samples = 0;

            for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
                const channel = audioBuffer.getChannelData(c);
                for (let i = 0; i < channel.length; i++) {
                    sum += channel[i] * channel[i];
                }
                samples += channel.length;
            }

            const rms = Math.sqrt(sum / samples);

            await audioContext.close();

            return rms < threshold;
        } catch (e) {
            // если формат не декодируется (часто iOS/webm)
            return false;
        }
    };

    const checkMicPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Разрешение есть
            stream.getTracks().forEach(track => track.stop());
            return 'granted';
        } catch (err) {
            if (err.name === 'NotAllowedError') return 'denied';
            if (err.name === 'NotFoundError') return 'no_device';
            return 'error';
        }
    };

    return {
        startRecording,
        stopRecording,
        isSilentBlob,
        checkMicPermission
    };
}