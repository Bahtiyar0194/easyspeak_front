export function useAudioRecorder() {
    let mediaRecorder = null;
    let audioChunks = [];
    let stream = null;

    const startRecording = async () => {
        if (!process.client) return;

        stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                audioChunks.push(e.data);
            }
        };

        mediaRecorder.start();
    };

    const stopRecording = () => {
        return new Promise((resolve) => {
            if (!mediaRecorder) return resolve(null);

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, {
                    type: mediaRecorder.mimeType || 'audio/webm',
                });

                // остановить микрофон
                stream.getTracks().forEach(t => t.stop());

                resolve(audioBlob);
            };

            mediaRecorder.stop();
        });
    };

    /**
 * Проверка: была ли речь или тишина
 */
    const isSilentBlob = async (blob, threshold = 0.01) => {
        if (!blob || blob.size === 0) return true;

        const audioContext = new AudioContext();
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
    };

    return {
        startRecording,
        stopRecording,
        isSilentBlob,
    };
}
