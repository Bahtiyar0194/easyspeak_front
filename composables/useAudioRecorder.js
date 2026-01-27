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

    return {
        startRecording,
        stopRecording,
    };
}
