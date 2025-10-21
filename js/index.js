import {
    formatDateTime, handleStartFasting,
    handleAbortFasting, handleEditFasting, handleLoadFasting
} from "./utils.js"

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

        if (fastingData) {
            fastingStatusDisplay.innerText = `${fastingData.status}`

            fastingStatusDisplay.className = ''
            fastingStatusDisplay.classList.add('badge', 'fs-6')

            switch (fastingData.status) {
                case '시작 전':
                    fastingStatusDisplay.classList.add('bg-secondary')
                    fastStartBtn.classList.remove('d-none')
                    fastCompleteBtn.classList.add('d-none')
                    fastStopBtn.classList.add('d-none')
                    fastingInformation.classList.add('d-none')
                    break
                case '진행 중':
                    fastingStatusDisplay.classList.add('bg-info')
                    fastStartBtn.classList.add('d-none');
                    fastCompleteBtn.classList.remove('d-none'); // '완료' 버튼 보이게
                    fastCompleteBtn.setAttribute('data-id', fastingData.id)
                    fastStopBtn.classList.remove('d-none');   // '중단' 버튼 보이게
                    fastStopBtn.setAttribute('data-id', fastingData.id)
                    fastingInformation.classList.remove('d-none')
                    fastingGoalDisplay.textContent = `${fastingData.target_duration_minutes / 60}시간 단식 목표`
                    fastingGoalTimeDisplay.textContent = `목표 시간: ${(fastingData.estimated_end_time_display).split('월 ')[1]}`
                    fastingDurationDisplay.innerText = `단식 시간: ${fastingData.current_elapsed_minutes_display}`
                    fastingRemainingDisplay.innerText = `남은 시간: ${fastingData.remaining_minutes}`
                    break;
                case '완료':
                    fastingStatusDisplay.classList.add('bg-primary')
                    fastStartBtn.classList.remove('d-none')
                    fastCompleteBtn.classList.add('d-none')
                    fastStopBtn.classList.add('d-none')
                    fastingInformation.classList.remove('d-none')
                    fastingGoalDisplay.textContent = `${fastingData.target_duration_minutes / 60}시간 단식 목표`
                    fastingDurationDisplay.innerText = `단식 시간: ${fastingData.current_elapsed_minutes_display}`
                    break
                case '중단':
                    fastingStatusDisplay.classList.add('bg-danger')
                    fastStartBtn.classList.remove('d-none')
                    fastCompleteBtn.classList.add('d-none')
                    fastStopBtn.classList.add('d-none')
                    fastingInformation.classList.remove('d-none')
                    fastingGoalDisplay.textContent = `${fastingData.target_duration_minutes / 60}시간 단식 목표`
                    fastingDurationDisplay.innerText = `단식 시간: ${fastingData.current_elapsed_minutes_display}`
                    break
                default:
                    fastingStatusDisplay.classList.add('bg-secondary')
                    fastStartBtn.classList.remove('d-none')
                    fastCompleteBtn.classList.add('d-none')
                    fastStopBtn.classList.add('d-none')
                    fastingInformation.classList.add('d-none')
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

    if (fastStopBtn) {
        fastStopBtn.addEventListener('click', (event) => {
            const btn = event.target
            const recordId = btn.dataset.id
            handleAbortFasting(recordId)
        })
    }
})