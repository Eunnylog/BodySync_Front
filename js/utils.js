// 페이지 로드 시 날짜 및 시간 설정
export function formatDateTime(targetDate = new Date()) {
    const year = targetDate.getFullYear()
    const month = String(targetDate.getMonth() + 1).padStart(2, '0')
    const day = String(targetDate.getDate()).padStart(2, '0')

    const hours = String(targetDate.getHours()).padStart(2, '0')
    const minutes = String(targetDate.getMinutes()).padStart(2, '0')

    // mealDateInput.value = `${year}-${month}-${day}`
    // mealTimeInput.value = `${hours}:${minutes}`

    return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`
    }
}


export function getPayload() {
    const payload = localStorage.getItem('payload')
    if (payload) {
        try {
            return JSON.parse(payload)
        } catch (e) {
            console.error('payload 불러오기 실패', e)
            return null
        }
    }
    return null
}