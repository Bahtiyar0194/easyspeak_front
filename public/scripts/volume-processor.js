class VolumeProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this._volume = 0;
    }

    process(inputs) {
        const input = inputs[0];
        if (input.length > 0) {
            const samples = input[0];
            let sum = 0;

            // Рассчет среднего уровня громкости
            for (let i = 0; i < samples.length; i++) {
                sum += samples[i] * samples[i];
            }
            const rms = Math.sqrt(sum / samples.length);
            this._volume = rms * 1000; // Умножаем на 1000 для масштабирования

            // Отправляем результат в главный поток
            this.port.postMessage(this._volume);
        }
        return true;
    }
}

registerProcessor('volume-processor', VolumeProcessor);