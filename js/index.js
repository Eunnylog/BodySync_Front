import { formatDateTime, formatErrorMessage } from "./utils.js"

let fastStartBtn
let fastCompleteBtn
let fastStopBtn
let fastingStatusDisplay
let fastingDurationDisplay
let fastingRemainingDisplay
let fastingGoalDisplay, fastingGoalTimeDisplay
let startFastingModal, endFastingModal
let startTimeInput, targetDurationInput
let startFastingSubmitBtn, hiddenFastingId
let editStartTimeInput, editCurrentMinutes, editEstimatedTime
let editRemainingTime, editGoalMinutes, fastingEditBtn, fastingNotesInput
let endTimeInput, editTargetDurationInput, fastingInformation

const today = formatDateTime(new Date())

async function updateDashboardCards() {
    const res = await loadDashboardData()

    if (res.ok) {
        const dashboardData = res.data
        console.log('dashboardData', dashboardData)

        // 1. 식단 요약 카드 업데이트
        const mealData = dashboardData.meal_summary
        if (mealData) {
            const calories = parseFloat(mealData.today_calories)
            document.getElementById('meal-calories-display').innerText = `${isNaN(calories) ? 0 : calories.toFixed(0)}`

            // 탄수화물
            const carbs = parseFloat(mealData.today_carbs)
            document.getElementById('meal-carbs-display').innerHTML = `${isNaN(carbs) ? 0 : carbs.toFixed(1)}`

            // 단백질
            const protein = parseFloat(mealData.today_protein)
            document.getElementById('meal-protein-display').innerText = `${isNaN(protein) ? 0 : protein.toFixed(1)}`

            // 지방
            const fat = parseFloat(mealData.today_fat)
            document.getElementById('meal-fat-display').innerText = `${isNaN(fat) ? 0 : fat.toFixed(1)}`

            // 당류
            const sugars = parseFloat(mealData.today_sugars)
            document.getElementById('meal-sugars-display').innerText = `${isNaN(sugars) ? 0 : sugars.toFixed(2)}`

            // 식이섬유
            const fiber = parseFloat(mealData.today_fiber)
            document.getElementById('meal-fiber-display').innerText = `${isNaN(fiber) ? 0 : fiber.toFixed(2)}`
        }

        // 2. 운동 요약 카드 업데이트
        const activityData = dashboardData.activity_summary
        if (activityData) {
            document.getElementById('activity-duration-display').innerText = `${activityData.today_duration_minutes}`
            document.getElementById('activity-calories-display').innerText = `${parseFloat(activityData.today_calories_burned).toFixed(0)}` // 소수점 버리고 정수 표시
        }

        // 3. 단식 요약 카드 업데이트
        const fastingData = dashboardData.fasting_summary
        if (fastingData.status == "진행 중") {
            fastStartBtn.classList.add('d-none');
            fastCompleteBtn.classList.remove('d-none'); // '완료' 버튼 보이게
            fastCompleteBtn.setAttribute('data-id', fastingData.id)
            fastStopBtn.classList.remove('d-none');   // '중단' 버튼 보이게
            fastStopBtn.setAttribute('data-id', fastingData.id)
            fastingInformation.classList.remove('d-none')
            fastingGoalDisplay.textContent = `${fastingData.target_duration_minutes / 60}시간 단식 목표`
            fastingGoalTimeDisplay.textContent = `${(fastingData.estimated_end_time_display).split('월 ')[1]}`

        } else {
            fastStartBtn.classList.remove('d-none');
            fastCompleteBtn.classList.add('d-none');
            fastStopBtn.classList.add('d-none');
            fastingInformation.classList.add('d-none')
            // fastingGoalDisplay.classList.add('d-none');
            // fastingGoalTimeDisplay.classList.add('d-none');
        }
        if (fastingData) {
            fastingStatusDisplay.innerText = `${fastingData.status}`
            fastingDurationDisplay.innerText = `${fastingData.current_elapsed_minutes_display}`
            fastingRemainingDisplay.innerText = `${fastingData.remaining_minutes}`

            fastingStatusDisplay.className = ''
            fastingStatusDisplay.classList.add('badge', 'fs-6')

            switch (fastingData.status) {
                case '시작 전':
                    fastingStatusDisplay.classList.add('bg-secondary')
                    break
                case '진행 중':
                    fastingStatusDisplay.classList.add('bg-info')
                    break;
                case '완료':
                    fastingStatusDisplay.classList.add('bg-primary')
                    break
                case '중단':
                    fastingStatusDisplay.classList.add('bg-danger')
                    break
                default:
                    fastingStatusDisplay.classList.add('bg-info')
            }
        }

        const inbodyData = dashboardData.inbody_summary
        if (inbodyData) {
            document.getElementById('inbody-weight-display').innerText = `${parseFloat(inbodyData.weight).toFixed(1)}`
            document.getElementById('inbody-muscle-display').innerText = `${parseFloat(inbodyData.skeletal_muscle_mass_kg).toFixed(1)}`
            document.getElementById('inbody-fat-display').innerText = `${parseFloat(inbodyData.body_fat_percentage).toFixed(1)}`
        }

    } else {
        const errorMessage = res.error
        window.showToast(errorMessage, 'danger')
    }

}


// 단식 시작
async function handleStartFasting() {
    const dateTime = startTimeInput.value
    const targetHours = parseInt(targetDurationInput.value)
    const targetMinutes = Math.round(targetHours * 60)

    const data = {
        "start_time": `${dateTime}:00`,
        "target_duration_minutes": targetMinutes
    }

    console.log(data)
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
async function handleAbortFasting(event) {
    const confirmed = confirm('현재 단식을 중단하겠습니까?')

    if (!confirmed) {
        return
    }
    const id = event.target.dataset.id
    const res = await abortFastingStart(id)

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


async function handleLoadFasting() {
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
async function handleEditFasting() {
    const id = hiddenFastingId.value
    const startTimeValue = editStartTimeInput.value
    console.log(startTimeValue)
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


document.addEventListener('DOMContentLoaded', function () {

    fastStartBtn = document.getElementById('fast-start-btn')
    fastCompleteBtn = document.getElementById('fast-complete-btn')
    fastStopBtn = document.getElementById('fast-stop-btn')
    fastingStatusDisplay = document.getElementById('fasting-status-display')
    fastingDurationDisplay = document.getElementById('fasting-duration-display')
    fastingRemainingDisplay = document.getElementById('fasting-remaining-display')
    fastingGoalDisplay = document.getElementById('fasting-goal-display')
    endFastingModal = document.getElementById('endFastingModal')
    startFastingModal = document.getElementById('startFastingModal')
    startTimeInput = document.getElementById('start-time-input')
    targetDurationInput = document.getElementById('target-duration-input')
    startFastingSubmitBtn = document.getElementById('start-fasting-submit-btn')
    fastingGoalTimeDisplay = document.getElementById('fasting-goal-time-display')
    hiddenFastingId = document.getElementById('hidden-fasting-id')
    editStartTimeInput = document.getElementById('edit-start-time-input')
    editCurrentMinutes = document.getElementById('current-minutes')
    editEstimatedTime = document.getElementById('estimated-time')
    editRemainingTime = document.getElementById('remaining-time')
    editGoalMinutes = document.getElementById('goal-minutes')
    fastingEditBtn = document.getElementById('end-fasting-submit-btn')
    fastingNotesInput = document.getElementById('notes-input')
    editTargetDurationInput = document.getElementById('edit-target-duration-input')
    endTimeInput = document.getElementById('end-time-input')
    fastingInformation = document.getElementById('fasting-information')

    updateDashboardCards()

    if (startFastingModal) {
        startFastingModal.addEventListener('hide.bs.modal', function () {
            startTimeInput.value = ''
            targetDurationInput = '16'
        })

        startFastingModal.addEventListener('show.bs.modal', function () {
            const date = today.date
            const time = today.time
            startTimeInput.value = `${date}T${time}`
        })

        startFastingSubmitBtn.addEventListener('click', handleStartFasting)
    }

    if (endFastingModal) {
        endFastingModal.addEventListener('show.bs.modal', (event) => {
            const btn = event.relatedTarget
            const fastingId = btn.dataset.id
            hiddenFastingId.value = fastingId
            handleLoadFasting()

            fastingEditBtn.addEventListener('click', handleEditFasting)
        })

        endFastingModal.addEventListener('hide.bs.modal', function () {
            hiddenFastingId.value = ''
            editStartTimeInput.value = ''
            fastingNotesInput.value = ''

        })
    }

    fastStopBtn.addEventListener('click', handleAbortFasting)
})