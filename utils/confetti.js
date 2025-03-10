import confetti from "canvas-confetti";

let confettiInstance = null;

export const startConfetti = (elemId) => {
    setTimeout(() => {
        const canvas = document.getElementById(elemId);
        if (canvas) {
            confettiInstance = confetti.create(canvas, { resize: true });
            confettiInstance({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
            });
        }
    }, 1000);
};

export const stopConfetti = () => {
    if (confettiInstance) {
        confettiInstance.reset();
    }
};