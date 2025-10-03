import { getPayload, formatDateTime, formatErrorMessage } from "./utils.js"

const payload = getPayload()
let isStaff
if (payload) {
    isStaff = payload['is_staff']
    console.log(isStaff)
} else {
    console.log('payload 불러오기 실패(activity form)')
}

const urlPrams = new URLSearchParams(window.location.search)
const recordDateByUrl = urlPrams.get('date')

let dateInput, prevDayBtn, nextDayBtn
let noActivityRecordsMessage, summaryContainer, manageExerciseBtn
let exerciseItemTemplate, activityRecordTemplate, activityRecordsListContainer
let totalDailyExerciseTime, totalDailyCaloriesBurned
let noExerciseItemsInRecord
let editActivityRecordBtn, deleteActivityRecordBtn

// 날짜, 시간
function initializeDateInput(date = new Date()) {
    const activityRecordDate = formatDateTime(date)
    dateInput.value = activityRecordDate.date

    handleLoadActivityRecord()
}


// 날짜 변경
async function changeDate(offset) {
    const currentDateStr = dateInput.value
    const currentSelectedDate = new Date(currentDateStr)

    currentSelectedDate.setDate(currentSelectedDate.getDate() + offset)

    initializeDateInput(currentSelectedDate)
}

// 운동 기록 불러오기
async function handleLoadActivityRecord() {
    const date = dateInput.value
    const res = await getActivityRecordFetch(date)

    if (res.ok) {
        const records = res.data
        renderActivityRecordsPage(records)
    } else {
        const errorMessage = formatErrorMessage(res.error)
        showToast(errorMessage, 'danger')
    }
}


function renderActivityRecordsPage(records) {
    activityRecordsListContainer.innerHTML = ''
    let totalDayCalories = 0
    let totalDayDuration = 0

    if (records.length === 0) {
        if (noActivityRecordsMessage) {
            noActivityRecordsMessage.style.display = 'block'
        }
    } else {
        records.forEach(record => {
            const activityRecordElement = renderSingleActivityRecord(record)
            if (activityRecordsListContainer) {
                activityRecordsListContainer.appendChild(activityRecordElement)
                totalDayCalories += record.total_calories_burned
                totalDayDuration += record.total_duration_minutes
            }
        })
    }

    if (totalDailyCaloriesBurned) {
        totalDailyCaloriesBurned.innerText = `${totalDayCalories}분`
    }
    if (totalDailyExerciseTime) {
        totalDailyExerciseTime.innerText = `${totalDayCalories} kcal`
    }
}

function renderSingleActivityRecord(record) {
    let totalRecordDuration = 0
    let totalRecordCalories = 0
    if (!activityRecordTemplate) {
        console.log('템플릿을 찾을 수 없습니다.')
        return null
    }

    const recordClone = activityRecordTemplate.content.cloneNode(true)
    const activityRecordDiv = recordClone.querySelector('.activity-record')
    activityRecordDiv.dataset.id = record.id
    activityRecordDiv.querySelector('.activity-record-time').innerText = record.formatted_time
    const notesDisplay = activityRecordDiv.querySelector('.activity-record-notes-display')
    const notesText = activityRecordDiv.querySelector('.activity-record-notes-text')
    if (record.notes) {
        notesText.textContent = record.notes
        notesDisplay.classList.remove('d-none')
    } else {
        notesText.textContent = ''
        notesDisplay.classList.add('d-none')
    }
    activityRecordDiv.querySelector('.edit-activity-record-btn').dataset.id = record.id
    activityRecordDiv.querySelector('.delete-activity-record-btn').dataset.id = record.id
    const exerciseItemsInRecord = activityRecordDiv.querySelector('.exercise-items-for-record')

    if (record.exercise_items && record.exercise_items.length > 0) {
        record.exercise_items.forEach(item => {
            const exerciseItemElement = renderSingleExerciseItem(record.id, item)
            if (exerciseItemElement) {
                if (exerciseItemsInRecord) {
                    exerciseItemsInRecord.appendChild(exerciseItemElement)
                }
            }

            totalRecordCalories += item.calculated_calories_burned
            totalRecordDuration += item.duration_minutes
        })
    } else {
        if (noExerciseItemsInRecord) {
            noExerciseItemsInRecord.style.display = 'none'
        }
    }
    activityRecordDiv.querySelector('.total-record-duration').innerText = `${totalRecordDuration}분`
    activityRecordDiv.querySelector('.total-record-calories').innerText = `${totalRecordCalories} kcal`
    return recordClone
}

function renderSingleExerciseItem(recordId, item) {
    if (!exerciseItemTemplate) {
        console.error('exerciseItemTemplate을 찾을 수 없습니다.');
        return null;
    }
    const itemClone = exerciseItemTemplate.content.cloneNode(true)
    const exerciseItemDiv = itemClone.querySelector('.exercise-item')
    exerciseItemDiv.querySelector('.exercise-name').innerText = item.exercise_name
    exerciseItemDiv.querySelector('.exercise-category').innerHTML = item.exercise_category_name
    const categoryBadge = itemClone.querySelector('.exercise-category')
    if (item.exercise_category_display) {
        categoryBadge.textContent = item.exercise_category_display;
        if (item.exercise_category_display === '근력') {
            categoryBadge.classList.add('bg-danger')
        } else if (item.exercise_category_display === '유산소') {
            categoryBadge.classList.add('bg-primary')
        } else {
            categoryBadge.classList.add('bg-secondary')
        }
    } else {
        categoryBadge.style.display = 'none'
    }
    const editBtn = exerciseItemDiv.querySelector('.edit-exercise-item-btn')
    if (editBtn) {
        editBtn.dataset.activityId = recordId
        editBtn.dataset.exerciseItemId = item.id
    }
    const deleteBtn = exerciseItemDiv.querySelector('.delete-exercise-item-btn')
    if (deleteBtn) {
        deleteBtn.dataset.activityId = recordId
        deleteBtn.dataset.exerciseItemId = item.id
    }
    exerciseItemDiv.querySelector('.exercise-duration').innerText = `${item.duration_minutes}분`
    exerciseItemDiv.querySelector('.exercise-sets').innerText = `${item.sets}`
    exerciseItemDiv.querySelector('.exercise-weight').innerText = `${item.weight}kg`
    exerciseItemDiv.querySelector('.exercise-reps').innerText = `${item.reps}`

    return itemClone

}


// 운동 기록 삭제
async function handleDeleteActivityRecord(recordId) {
    const confirmed = confirm('운동 기록을 삭제하시겠습니까?')

    if (confirmed) {
        const res = await deleteActivityRecordFetch(recordId)

        if (res.ok) {
            window.showToast('운동 기록 삭제 완료', 'info')
            setTimeout(() => {
                window.location.reload()
            }, 1500)
        } else {
            const errorMessage = formatErrorMessage(res.error)
            window.showToast(errorMessage, 'danger')
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    dateInput = document.getElementById('activity-date')
    prevDayBtn = document.getElementById('prev-day-btn')
    nextDayBtn = document.getElementById('next-day-btn')
    manageExerciseBtn = document.getElementById('manage-exercises-button')

    noActivityRecordsMessage = document.getElementById('no-activity-records-message')
    summaryContainer = document.getElementById('activity-summary-container')
    exerciseItemTemplate = document.getElementById('exercise-item-template')
    activityRecordTemplate = document.getElementById('activity-record-template')
    activityRecordsListContainer = document.getElementById('activity-records-list-container')
    totalDailyCaloriesBurned = document.getElementById('total-daily-calories-burned')
    totalDailyExerciseTime = document.getElementById('total-daily-exercise-time')
    noExerciseItemsInRecord = document.getElementsByClassName('no-exercise-items-in-record')


    initializeDateInput()

    if (!isStaff) {
        manageExerciseBtn.style.display = 'none'
    }

    // url에 date가 없을 경우 오늘날짜로
    if (recordDateByUrl) {
        const parseDate = new Date(recordDateByUrl)
        initializeDateInput(parseDate)
    } else {
        initializeDateInput()
    }


    // 어제
    if (prevDayBtn) {
        prevDayBtn.addEventListener('click', async function (event) {
            event.preventDefault()
            await changeDate(-1)
        })
    }

    // 내일
    if (nextDayBtn) {
        nextDayBtn.addEventListener('click', async function (event) {
            event.preventDefault()
            await changeDate(1)
        })
    }

    // date input에서 직접 변경
    dateInput.addEventListener('change', async function () {
        const selectedDate = new Date(this.value)
        initializeDateInput(selectedDate)
    })

    if (activityRecordsListContainer) {
        activityRecordsListContainer.addEventListener('click', (event) => {
            const target = event.target

            // 기록 수정 버튼
            if (target.classList.contains('edit-activity-record-btn')) {
                const recordId = target.dataset.id
                if (recordId) {
                    window.location.href = `activity_form.html?id=${recordId}`
                }
            } else if (target.classList.contains('delete-activity-record-btn')) {
                // 기록 삭제 버튼
                console.log('기록삭제버튼')
                const recordId = target.dataset.id
                if (recordId) {
                    handleDeleteActivityRecord(recordId)
                }
            }
        })
    }
})