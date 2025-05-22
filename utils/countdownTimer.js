import { ref, onMounted, onUnmounted } from 'vue'

export function countdownTimer(endDateStr, onComplete = () => { }) {
    const timeLeft = ref('00:00:00')
    let intervalId

    // Преобразуем строку с пробелом в ISO формат с 'T'
    const endDate = new Date(endDateStr.replace(' ', 'T'))

    const updateTime = () => {
        const now = new Date()
        const diff = endDate - now

        if (diff <= 0) {
            timeLeft.value = '00:00:00'
            clearInterval(intervalId)
            onComplete()
            return
        }

        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)

        const pad = (n) => String(n).padStart(2, '0')
        timeLeft.value = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    }

    onMounted(() => {
        updateTime()
        intervalId = setInterval(updateTime, 1000)
    })

    onUnmounted(() => {
        clearInterval(intervalId)
    })

    return {
        timeLeft,
    }
}