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
const activityRecordId = urlPrams.get('id')


// 운동 수정 모드 유무
let isEdit = false
let activityRecordData = null

let activityForm, exerciseForm
let dateInput, timeInput, notesInput
let exerciseSearchInput, exerciseSearchResults
let exerciseSearchBtn
let selectedExerciseList, removeExerciseBtn
let createActivityRecordBtn

let exerciseItemsContainer, exerciseTemplate
let exerciseIndex = 0

let exerciseCreateModal, createExerciseBtn
let exerciseNameInput, exerciseCategoryInput, exerciseBaseUnitInput, exerciseCaloriesInput

// 날짜, 시간
function initializeDateInput(date = new Date()) {
    const dateTime = formatDateTime(date)

    dateInput.value = dateTime.date
    timeInput.value = dateTime.time
}

// 운동 검색
async function handleExerciseSearch() {
    const searchStr = exerciseSearchInput.value.trim()

    if (!searchStr) {
        window.showToast('검색할 운동명을 입력해주세요.', 'warning')
        exerciseSearchResults.innerHTML = '<li class="list-group-item text-muted">검색할 운동명을 입력해 주세요.</li>'
        return
    }

    const res = await exerciseSearchFetch(searchStr)
    if (res.ok) {
        renderExerciseSearchResults(res.data)
        window.showToast(`${searchStr}에 대한 검색 결과 ${res.data.length}개를 찾았습니다.`, 'info')
    } else {
        console.error(res.error)
        const errorMessage = formatErrorMessage(res.error)
        window.showToast(res.error, 'danger')
    }
    exerciseSearchInput.value = ''
}


// 운동 검색 결과 렌더링
function renderExerciseSearchResults(data) {
    exerciseSearchResults.innerHTML = ''

    if (data && data.length > 0) {
        data.forEach(exercise => {
            const li = document.createElement('li')
            li.className = 'list-group-item d-flex justify-content-between align-items-center'
            li.dataset.id = exercise.id
            li.innerHTML = `
                <div class="flex-grow-1 me-2">
                    <h6 class="mb-1"><strong>${exercise.exercise_name}</strong></h6>
                    <p class="mb-0 text-muted small">
                        칼로리: ${exercise.calories_per_unit}kcal / ${exercise.base_unit}
                        <span class="mx-1">|</span>
                        카테고리: ${exercise.category_display}
                    </p>
                </div>
                <button type="button" class="btn btn-sm btn-outline-success add-exercise-btn"
                        data-id="${exercise.id}"
                        data-name="${exercise.exercise_name}"
                        data-calories="${exercise.calories_per_unit}"
                        data-unit="${exercise.base_unit}"
                        data-category="${exercise.category}">
                    추가
                </button>
            `
            exerciseSearchResults.appendChild(li)
        })
    }
}


// 선택된 운동 렌더
function renderSelectedExerciseResult(exerciseData) {
    // 중복 검사
    if (exerciseItemsContainer) {
        const existingExerciseItems = exerciseItemsContainer.querySelectorAll('.exercise-item')
        let isDuplicate = false
        existingExerciseItems.forEach(item => {
            console.log(item.dataset.id, exerciseData.id)
            if (parseInt(item.dataset.id) === parseInt(exerciseData.id)) {
                isDuplicate = true
                return
            }
        })

        if (isDuplicate) {
            window.showToast(`${exerciseData.name}(은)는 이미 추가된 운동입니다.`, 'danger')
            return
        }
    } else {
        console.error('exerciseItemContainer가 초기화되지 않음')
        return
    }

    if (!exerciseTemplate) {
        console.error('exerciseTemplate 에러')
        return
    }

    // template clone -> 복사 후 데이터 넣기
    const clone = exerciseTemplate.content.cloneNode(true)  // true: 자식까지 클론
    const exerciseDiv = clone.querySelector('.exercise-item') // 가장 바깥 div
    exerciseDiv.dataset.id = exerciseData.id

    // 현재 항목의 인덱스 할당 및 증가
    const currentIndex = exerciseIndex++
    exerciseDiv.dataset.index = currentIndex

    // name
    const selectedExerciseNameSpan = exerciseDiv.querySelector('.selected-exercise-name')
    if (selectedExerciseNameSpan) {
        selectedExerciseNameSpan.textContent = `${exerciseData.name} (${exerciseData.exerciseCalories}kcal / ${exerciseData.unit})`
    }
    // id hidden 필드
    const exerciseIdInput = exerciseDiv.querySelector('.exercise-id-input')
    if (exerciseIdInput) {
        exerciseIdInput.value = exerciseData.id
        exerciseIdInput.name = `exercise_items_to_create[${currentIndex}].exercise`
        exerciseIdInput.dataset.caloriesPerUnit = exerciseData.exerciseCalories
    }
    // 각 input의 id, name
    const inputsToUpdate = [
        // 셀렉터, id만들 때 접두사, name 속성 뒷부분
        { originalSelector: '#duration_minutes-0', newIdPrefix: 'duration_minutes', nameSuffix: 'duration_minutes' },
        { originalSelector: '#sets-0', newIdPrefix: 'sets', nameSuffix: 'sets' },
        { originalSelector: '#reps-0', newIdPrefix: 'reps', nameSuffix: 'reps' },
        { originalSelector: '#weight-0', newIdPrefix: 'weight', nameSuffix: 'weight' },
    ]
    inputsToUpdate.forEach(item => {
        const input = exerciseDiv.querySelector(item.originalSelector)
        if (input) {
            const newId = `${item.newIdPrefix}-${currentIndex}`
            input.id = newId
            input.name = `exercise_items_to_create[${currentIndex}].${item.nameSuffix}`
            const label = exerciseDiv.querySelector(`label[for="${item.originalSelector.replace('#', '')}"]`)
            if (label) {
                label.setAttribute('for', input.id)
            }
        }
    })
    // 실제로 추가
    if (exerciseItemsContainer) {
        const placeholder = exerciseItemsContainer.querySelector('.exercise-placeholder')
        if (placeholder) {
            placeholder.remove()
        }
        window.showToast(`${exerciseData.name}(이)가 추가되었습니다.`, 'info')
        exerciseItemsContainer.appendChild(clone)
    } else {
        console.error('exerciseItemsContainer 요소를 찾을 수 없음')
    }
}


// 선택된 운동 삭제
function deleteSelectedExercise(exerciseItemElement) {
    if (exerciseItemElement) {
        exerciseItemElement.remove()
        if (exerciseItemsContainer && exerciseItemsContainer.children.length === 0) {
            exerciseItemsContainer.innerHTML = '<p class="text-muted exercise-placeholder">운동 항목을 추가해 주세요.</p>'
        }
        calculateTotalExerciseInformation()
    }
}


// 운동 정보 계산
function calculateTotalExerciseInformation() {
    let totalMinutes = 0
    let totalCalories = 0

    const allExerciseItems = document.querySelectorAll('#exerciseItemsContainer .exercise-item')

    allExerciseItems.forEach(item => {
        const durationInput = item.querySelector('.duration-minutes-input')
        const setsInput = item.querySelector('.sets-input')
        const exerciseIdInput = item.querySelector('.exercise-id-input')
        const duration = parseFloat(durationInput.value || 0)
        const sets = parseFloat(setsInput.value || 1)

        const caloriesPerMinutes = parseFloat(exerciseIdInput?.dataset.caloriesPerUnit || 0)
        console.log('칼', exerciseIdInput.dataset.caloriesPerUnit)
        let itemEffectiveDuration = 0

        // 세트 값이 1보다 크거나 세트에 값이 있다면 세트당 시간으로 간주
        if (sets > 1) {
            itemEffectiveDuration = duration * sets
        } else {
            itemEffectiveDuration = duration
        }

        const itemCalories = itemEffectiveDuration * caloriesPerMinutes

        totalCalories += itemCalories
        totalMinutes += itemEffectiveDuration

        document.getElementById('total-minutes-display').textContent = `총 운동 시간(분) : ${totalMinutes}분`
        document.getElementById('total-calories-display').textContent = `총 소모 칼로리 : ${totalCalories || 0}kcal`

    })

    if (exerciseItemsContainer && exerciseItemsContainer.children.length === 0) {
        document.getElementById('total-minutes-display').textContent = `총 운동 시간(분) : 0분`
        document.getElementById('total-calories-display').textContent = `총 소모 칼로리 : 0kcal`
    }
}


// 운동 기록 폼 생성
function collectedExerciseItemsData() {
    const collectedItems = []
    const allExerciseItems = document.querySelectorAll('#exerciseItemsContainer .exercise-item')

    // forEach 대신 for...of를 사용하면 중간에 return으로 함수를 종료시킬 수 있음
    for (const item of allExerciseItems) {
        const exerciseIdInput = item.querySelector('.exercise-id-input')
        const durationInput = item.querySelector('.duration-minutes-input')
        const setsInput = item.querySelector('.sets-input')
        const repsInput = item.querySelector('.reps-input')
        const weightInput = item.querySelector('.weight-input')

        const exerciseId = parseInt(exerciseIdInput.value || 0)
        const durationMinutes = parseFloat(durationInput?.value || 1)
        const sets = parseFloat(setsInput?.value || 0)
        const reps = parseFloat(repsInput?.value || 0)
        const weight = parseFloat(weightInput?.value || 0)

        if (exerciseId === 0) {
            window.showToast('선택되지 않은 운동 항목이 있습니다. 목록에서 운동을 선택해주세요', 'danger')
            return null
        }

        if (durationMinutes < 1) {
            window.showToast('운동 시간을 입력해주세요', 'danger')
            return null
        }

        collectedItems.push({
            exercise: exerciseId,
            duration_minutes: durationMinutes,
            sets: sets,
            reps: reps,
            weight: weight
        })
    }
    return collectedItems
}


async function handleActivityRecordCreate(event) {
    event.preventDefault()

    const date = dateInput.value
    const time = timeInput.value
    const notes = notesInput.value
    const exerciseItemsData = collectedExerciseItemsData()

    if (exerciseItemsData === null) {
        return
    }

    if (exerciseItemsData.length === 0) {
        window.showToast('추가된 운동 항목이 없습니다.\n최소 하나 이상의 운동을 추가해주세요.', 'warning')
        return
    }

    activityRecordData = {
        date: date,
        time: `${date}T${time}:00`,
        notes: notes,
        exercise_items_to_create: exerciseItemsData
    }
    console.log(activityRecordData)

    const result = await activityRecordCreateFetch(activityRecordData)

    if (!result) {
        window.showToast('운동 기록 완료!', 'info')
        setTimeout(() => {
            window.location.href = "activity_record.html"
        }, 1500)
    } else {
        const errorMessages = formatErrorMessage(result)
        console.log(errorMessages)
        window.showToast(errorMessages, 'danger')
    }
}


// 운동 항목 등록
async function handleExerciseCreate(event) {
    event.preventDefault()

    const name = exerciseNameInput.value
    const category = exerciseCategoryInput.value
    const calories = exerciseCaloriesInput.value || 0
    const baseUnit = exerciseBaseUnitInput.value || "분"

    if (!name || category.length === 0 || !calories) {
        window.showToast('운동명, 카테고리, 칼로리는 필수 입력값입니다.', 'danger')
        return
    }

    const exerciseData = {
        "exercise_name": name,
        "category": parseInt(category),
        "calories_per_unit": parseFloat(calories),
        "base_unit": baseUnit
    }
    const res = await exerciseCreateFetch(exerciseData)

    if (res['isSuccess']) {
        showToast('운동 항목 등록 완료되었습니다.', 'info')
        setTimeout(() => {
            window.location.href = 'activity_record.html'
        }, 1500)
    } else {
        let errorMessage = formatErrorMessage(res['res'])
        if (errorMessage === "운동 종류 with this 운동 이름 already exists.") {
            showToast('이미 등록된 운동입니다.', 'danger')
        } else {
            showToast(errorMessage, 'danger')
        }
    }

}


// 수정 record의 exercise items 렌더
function renderEditExerciseItems(exerciseItems) {
    if (exerciseItems && exerciseItems.length > 0) {
        exerciseItemsContainer.innerHTML = ''

        exerciseItems.forEach(item => {
            const clone = exerciseTemplate.content.cloneNode(true)
            const exerciseItemDiv = clone.querySelector('.exercise-item')
            exerciseItemDiv.dataset.id = item.id
            exerciseItemDiv.querySelector('.selected-exercise-name').textContent = `${item.exercise_name} (${item.exercise_calories_per_unit}kcal / ${item.exercise_base_unit})`

            const exerciseIdInput = exerciseItemDiv.querySelector('.exercise-id-input')
            exerciseIdInput.name = `exercise_items_to_update[${item.id}].exercise`
            exerciseIdInput.value = item.exercise
            exerciseIdInput.dataset.caloriesPerUnit = item.exercise_calories_per_unit

            const durationInput = exerciseItemDiv.querySelector('.duration-minutes-input')
            durationInput.id = `duration_minutes-${item.id}`
            durationInput.name = `exercise_items_to_update[${item.id}].duration_minutes`
            durationInput.value = item.duration_minutes
            const durationLabel = exerciseItemDiv.querySelector(`label[for^="duration_minutes-"]`) // 'duration_minutes-'로 시작하는 for 속성을 가진 label을 찾음
            if (durationLabel) {
                durationLabel.setAttribute('for', durationInput.id);
            }

            const setsInput = exerciseItemDiv.querySelector('.sets-input')
            setsInput.id = `sets-${item.id}`
            setsInput.name = `exercise_items_to_update[${item.id}].sets`
            setsInput.value = item.sets
            const setsLabel = exerciseItemDiv.querySelector(`label[for^="sets-"]`)
            if (setsLabel) {
                setsLabel.setAttribute('for', setsInput.id);
            }

            const repsInput = exerciseItemDiv.querySelector('.reps-input')
            repsInput.id = `reps-${item.id}`
            repsInput.name = `exercise_items_to_update[${item.id}].reps`
            repsInput.value = item.reps
            const repsLabel = exerciseItemDiv.querySelector(`label[for^="reps-"]`)
            if (repsLabel) {
                repsLabel.setAttribute('for', repsInput.id);
            }


            const weightInput = exerciseItemDiv.querySelector('.weight-input')
            weightInput.id = `weight-${item.id}`
            weightInput.name = `exercise_items_to_update[${item.id}].weight`
            weightInput.value = item.weight
            const weightLabel = exerciseItemDiv.querySelector(`label[for^="weight-"]`)
            if (weightLabel) {
                weightLabel.setAttribute('for', setsInput.id);
            }
            exerciseItemsContainer.appendChild(clone)
        })
    }
    calculateTotalExerciseInformation()
}

// 수정할 데이터 로드
async function loadEditActivityRecord(recordId) {
    const res = await getActivityRecordDetail(recordId)

    if (res.ok) {
        const record = await res.data
        if (record) {
            initializeDateInput(new Date(record.time))
            notesInput.value = record.notes
            renderEditExerciseItems(record.exercise_items)
            console.log('record', record)
        }
    } else {
        const errorMessage = formatErrorMessage(res.error)
        window.showToast(errorMessage, 'danger')
    }
}


document.addEventListener('DOMContentLoaded', function () {
    dateInput = document.getElementById('date')
    timeInput = document.getElementById('time')
    notesInput = document.getElementById('notes')

    activityForm = document.getElementById('activityForm')
    exerciseItemsContainer = document.getElementById('exerciseItemsContainer')
    exerciseTemplate = document.getElementById('exerciseItemTemplate')

    exerciseSearchInput = document.getElementById('exercise-search-input')
    exerciseSearchBtn = document.getElementById('exercise-search-btn')
    exerciseSearchResults = document.getElementById('exercise-search-results')
    createActivityRecordBtn = document.getElementById('create-activity-record')

    exerciseCreateModal = document.getElementById('exercise-create-modal')
    exerciseForm = document.getElementById('exercise-create-form')
    exerciseNameInput = document.getElementById('exercise-name-input')
    exerciseCategoryInput = document.getElementById('exercise-category-input')
    exerciseCaloriesInput = document.getElementById('exercise-calories-input')
    exerciseBaseUnitInput = document.getElementById('exercise-base-unit-input')
    createExerciseBtn = document.getElementById('create-exercise-btn')
    console.log('isEdit 확인 전', isEdit)

    const title = document.getElementById('activity-title')
    if (activityRecordId) {
        isEdit = true
        console.log('isEdit 확인 후', isEdit)
        title.innerText = '운동 기록 수정'
        loadEditActivityRecord(activityRecordId)
    } else {
        isEdit = false
        console.log('isEdit 확인 후', isEdit)
        initializeDateInput()

    }


    // 운동 검색 버튼
    if (exerciseSearchBtn) {
        exerciseSearchBtn.addEventListener('click', () => {
            const searchStr = exerciseSearchInput.value.trim()
            if (searchStr.length > 0) {
                handleExerciseSearch(searchStr)
            }
        })
    }

    // 운동 검색 결과 UI
    if (exerciseSearchResults) {
        exerciseSearchResults.addEventListener('click', (event) => {
            if (event.target.classList.contains('add-exercise-btn')) {
                const addBtn = event.target

                const exerciseData = {
                    id: addBtn.dataset.id,
                    name: addBtn.dataset.name,
                    exerciseCalories: addBtn.dataset.calories,
                    unit: addBtn.dataset.unit,
                    category: addBtn.dataset.category

                }
                renderSelectedExerciseResult(exerciseData)
                calculateTotalExerciseInformation(exerciseData)
            }
        })
    }

    // 선택된 운동
    if (exerciseItemsContainer) {
        exerciseItemsContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-exercise-item-btn')) {
                console.log(event.target.closest('.exercise-item'))
                const exerciseItemElement = event.target.closest('.exercise-item')
                deleteSelectedExercise(exerciseItemElement)
            }
        })

        exerciseItemsContainer.addEventListener('change', (event) => {
            if (event.target.classList.contains('duration-minutes-input') || event.target.classList.contains('sets-input')) {
                calculateTotalExerciseInformation()
            }
        })
    }


    // // 운동 검색 입력창에서만 엔터
    if (exerciseSearchInput) {
        exerciseSearchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault()
                handleExerciseSearch()
                // const searchStr = exerciseSearchInput.value
                // if (searchStr.length > 0) {
                // } else {
                //     showToast('검색창에 ')
                // }
            }
        })
    }

    if (activityForm) {
        exerciseSearchInput.addEventListener('keydown', (event) => {
            // 검색 입력창에서만 엔터 동작
            if (event.key === 'Enter') {
                event.preventDefault()
                handleExerciseSearch()
            }
        })
        const formInputs = activityForm.querySelectorAll('input:not([type="submit"]), textarea:not(#notes)')
        formInputs.forEach(input => {
            if (input) {
                input.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        if (input.tagName === 'TEXTAREA' && input.id === 'notes') {
                            // 엔터 허용
                        } else {
                            event.preventDefault()
                        }
                    }
                })
            }
        })

        activityForm.addEventListener('submit', handleActivityRecordCreate)
    }
    calculateTotalExerciseInformation()


    if (exerciseCreateModal) {
        exerciseCreateModal.addEventListener('hide.bs.modal', function () {
            if (exerciseNameInput) exerciseNameInput.value = ''
            if (exerciseCategoryInput) exerciseCategoryInput.value = ''
            if (exerciseCaloriesInput) exerciseCaloriesInput.value = ''
            if (exerciseBaseUnitInput) exerciseBaseUnitInput.value = ''
        })
    }

    if (exerciseForm) {
        const inputs = [exerciseNameInput, exerciseCategoryInput, exerciseCaloriesInput, exerciseBaseUnitInput]
        inputs.forEach(input => {
            if (input) {
                input.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault()
                    }
                })
            }
        })

        exerciseForm.addEventListener('submit', handleExerciseCreate)
    }

    // 운동 등록 버튼
    if (createExerciseBtn) {
        if (isStaff === true) {
            createExerciseBtn.style.display = 'block'
            console.log('is_staff=true')
        } else {
            createExerciseBtn.style.display = 'none'
            console.log('is_staff=false')
        }
    }


    if (exerciseItemsContainer) {
        exerciseItemsContainer.addEventListener('keydown', (event) => {
            if (event.target.tagName === 'INPUT') {
                if (event.key === 'Enter') {
                    event.preventDefault()
                }
            }
        })
    }
});