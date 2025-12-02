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



// index & fasting_record에서 공용으로 사용하는 함수
export async function handleStartFasting() {
    const startTimeInput = document.getElementById('start-time-input')
    const targetDurationInput = document.getElementById('target-duration-input')

    const dateTime = startTimeInput.value
    const targetHours = parseInt(targetDurationInput.value)
    const targetMinutes = Math.round(targetHours * 60)

    const data = {
        "start_time": `${dateTime}:00`,
        "target_duration_minutes": targetMinutes
    }

    const res = await createFastingRecord(data)

    if (res.ok) {
        window.showToast('단식을 시작합니다', 'info')
        setTimeout(() => {
            window.location.reload()
        }, 1500);
    } else {
        const errorMessage = formatErrorMessage(res.error)
        window.showToast(errorMessage, 'danger')
    }
}


// 단식 중단
export async function handleAbortFasting(recordId) {
    const confirmed = confirm('현재 단식을 중단하겠습니까?')

    if (!confirmed) {
        return
    }

    const res = await abortFastingStart(recordId)

    if (res.ok) {
        window.showToast('단식을 중단했습니다.', 'info')
        setTimeout(() => {
            window.location.reload()
        }, 1500)
    } else {
        const errorMessage = formatErrorMessage(res.error)
        window.showToast(errorMessage, 'danger')
    }
}

const hiddenFastingId = document.getElementById('hidden-fasting-id')
const editStartTimeInput = document.getElementById('edit-start-time-input')
const editCurrentMinutes = document.getElementById('current-minutes')
const fastingNotesInput = document.getElementById('notes-input')
const editTargetDurationInput = document.getElementById('edit-target-duration-input')
const endTimeInput = document.getElementById('end-time-input')
const editEstimatedTime = document.getElementById('estimated-time')
const editRemainingTime = document.getElementById('remaining-time')
const editGoalMinutes = document.getElementById('goal-minutes')

export async function handleLoadFasting() {
    const fastingId = hiddenFastingId.value
    if (!fastingId) {
        window.showToast('단식 id 불러오기에 실패했습니다.', 'danger')
        return
    }

    const res = await getFastingDetail(fastingId)

    if (res.ok) {
        const data = res.data

        editGoalMinutes.innerText = `${Math.round(data.target_duration_minutes / 60)}시간`
        editCurrentMinutes.innerText = data.current_elapsed_minutes_display
        editEstimatedTime.innerText = (data.estimated_end_time_display).split('월 ')[1]

        if (data.remaining_minutes === 0) {
            editRemainingTime.innerText = `${data.remaining_minutes}분`
        } else {
            const hours = Math.floor(data.remaining_minutes / 60)
            const minutes = data.remaining_minutes % 60

            if (hours > 0) {
                editRemainingTime.innerText = `${hours}시간 ${minutes}분`
            } else {
                editRemainingTime.innerText = `${minutes}분`
            }
        }

        editStartTimeInput.value = data.start_time
        editTargetDurationInput.value = Math.round(data.target_duration_minutes / 60)
        fastingNotesInput.value = data.notes

    }
}

// 단식 수정
export async function handleEditFasting() {
    const id = hiddenFastingId.value
    const startTimeValue = editStartTimeInput.value
    const endTimeValue = endTimeInput.value
    const targetHours = parseFloat(editTargetDurationInput.value)
    const notes = fastingNotesInput.value

    const data = {
        "start_time": `${startTimeValue}:00`,
        "target_duration_minutes": Math.round(targetHours * 60),
        "notes": notes
    }

    // 단식 종료
    if (endTimeValue) {
        const confirmed = confirm('종료 시각을 입력했습니다.\n단식을 종료하시겠습니까?')

        if (confirmed) {
            data.end_time = `${endTimeValue}:00`
            data.status = 2
        }
    }

    const res = await editFastingFetch(data, id)

    if (res.ok) {
        if (endTimeValue) {
            window.showToast('단식을 성공적으로 마무리했습니다. 축하합니다!', 'info')
        } else {
            window.showToast('단식 기록 수정 완료!', 'info')
        }
        setTimeout(() => {
            window.location.reload()
        }, 1500);
    } else {
        const errorMessage = formatErrorMessage(res.error)
        window.showToast(errorMessage, 'danger')
    }
}