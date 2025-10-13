// 페이지 로드 시 날짜 및 시간 설정
export function formatDateTime(targetDate = new Date()) {
    const year = targetDate.getFullYear()
    const month = String(targetDate.getMonth() + 1).padStart(2, '0')
    const day = String(targetDate.getDate()).padStart(2, '0')

    const hours = String(targetDate.getHours()).padStart(2, '0')
    const minutes = String(targetDate.getMinutes()).padStart(2, '0')

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


/**
 * 중첩된 에러메시지를 평탄화하여 읽기 쉬운 문자열로 포맷
 * @param {object|string|array} errorData - drf 응답 데이터
 * @param {string} prefix - 중첩된 필드를 위한 접두사 e.g) exercise_items[0].reps
 * @return {string} - 포맷팅된 에러 메시지 문자열
 */
export function formatErrorMessage(errorData, prefix = '') {
    let messages = []

    if (typeof errorData === 'string') {
        messages.push(`${errorData}`)
    } else if (Array.isArray(errorData)) {
        errorData.forEach((item, index) => {
            if (typeof item === 'string') {
                messages.push(`${item}`)
            } else {
                messages = messages.concat(formatErrorMessage(item, `${prefix}[${index}]`))
            }
        })
    } else if (typeof errorData === 'object' && errorData !== null) {
        if (errorData.non_field_errors) {
            messages = messages.concat(formatErrorMessage(errorData.non_field_errors, `${prefix ? prefix + ' : ' : ''}일반오류`))
            delete errorData.non_field_errors // 중복 방지
        }
        if (errorData.detail) {
            messages = messages.concat(formatErrorMessage(errorData.detail, prefix))
            delete errorData.detail
        }

        for (const key in errorData) {
            if (Object.hasOwnProperty.call(errorData, key)) {
                const newPrefix = prefix ? `${prefix}.${key}` : key
                messages = messages.concat(formatErrorMessage(errorData[key], newPrefix))
            }
        }
    }
    return messages.join('\n')
}