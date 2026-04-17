export function useAudioRecorder() {
    let mediaRecorder = null;
    let audioChunks = [];
    let stream = null;

    const cleanupStream = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            stream = null;
        }
    };

    const getSupportedMimeType = () => {
        const types = [
            'audio/webm;codecs=opus', // Chrome / Android
            'audio/webm',
            'audio/mp4', // iOS Safari
            'audio/aac',
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return '';
    };

    const getFileExtension = (mimeType = '') => {
        if (mimeType.includes('mp4')) return 'mp4';
        if (mimeType.includes('aac')) return 'aac';
        if (mimeType.includes('ogg')) return 'ogg';
        if (mimeType.includes('mpeg')) return 'mp3';
        return 'webm';
    };

    const startRecording = async () => {
        if (!process.client) return;

        cleanupStream();

        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mimeType = getSupportedMimeType();

            mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
            audioChunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    audioChunks.push(e.data);
                }
            };

            // Required for iOS.
            mediaRecorder.start(100);
        } catch (error) {
            cleanupStream();
            mediaRecorder = null;
            audioChunks = [];
            throw error;
        }
    };

    const stopRecording = () => {
        return new Promise((resolve, reject) => {
            if (!mediaRecorder || mediaRecorder.state === 'inactive') {
                cleanupStream();
                mediaRecorder = null;
                audioChunks = [];
                return resolve(null);
            }

            const recorder = mediaRecorder;

            recorder.onstop = () => {
                const blob = new Blob(audioChunks, {
                    type: recorder.mimeType || 'audio/mp4',
                });

                // Stop the microphone stream.
                cleanupStream();
                mediaRecorder = null;
                audioChunks = [];

                resolve(blob);
            };

            recorder.onerror = (event) => {
                cleanupStream();
                mediaRecorder = null;
                audioChunks = [];
                reject(event.error || new Error('Audio recording failed'));
            };

            recorder.stop();
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
            // Some browser formats, especially on iOS, may not decode here.
            return false;
        }
    };

    const checkMicPermission = async () => {
        try {
            const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Permission is available.
            permissionStream.getTracks().forEach((track) => track.stop());
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
        checkMicPermission,
        getFileExtension,
    };
}
