import { getPayload, formatDateTime } from "./utils.js"
const payload = getPayload()

if (payload) {
    const isStaff = payload['is_staff']
    console.log(isStaff)
} else {
    console.log('payload 불러오기 실패(activity form)')
}

const urlPrams = new URLSearchParams(window.location.search)
const activityRecordId = urlPrams.get('id')


// 운동 수정 모드 유무
let isEdit = false
let activityRecordData = null

let activityForm
let dateInput, timeInput, memoInput
let exerciseSearchInput, exerciseSearchResults
let exerciseSearchBtn, addExerciseBtn, createExerciseBtn
let selectedExerciseList, removeExerciseBtn

let exerciseItemsContainer, exerciseTemplate
let exerciseIndex = 0

let totalInformation

// 날짜, 시간
function initializeDateInput(date = new Date()) {
    const dateTime = formatDateTime(date)

    dateInput.value = dateTime.date
    timeInput.value = dateTime.time
}

// 운동 검색
async function handleExerciseSearch() {
    const searchStr = exerciseSearchInput.value.trim()
    exerciseSearchInput.value = ''

    if (!searchStr) {
        showToast('검색할 운동명을 입력해주세요.', 'warning')
        exerciseSearchResults.innerHTML = '<li class="list-group-item text-muted">검색할 운동명을 입력해 주세요.</li>'
        return
    }

    const data = await exerciseSearchFetch(searchStr)
    if (data) {
        renderExerciseSearchResults(data)
        window.showToast(`${searchStr}에 대한 검색 결과 ${data.length}개를 찾았습니다.`, 'success')
    } else {
        console.error(data)
        window.showToast('검색결과가 없습니다. 다시 입력해주세요.', 'danger')
    }
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
        window.showToast(`${exerciseData.name}(이)가 추가되었습니다.`, 'success')
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
        const setsInput = item.querySelector('.set-input')
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
async function handleActivityRecordCreate() {

}

document.addEventListener('DOMContentLoaded', function () {
    dateInput = document.getElementById('date')
    timeInput = document.getElementById('time')

    activityForm = document.getElementById('activityForm');
    exerciseItemsContainer = document.getElementById('exerciseItemsContainer');
    exerciseTemplate = document.getElementById('exerciseItemTemplate');

    exerciseSearchInput = document.getElementById('exercise-search-input')
    exerciseSearchBtn = document.getElementById('exercise-search-btn')
    exerciseSearchResults = document.getElementById('exercise-search-results')
    totalInformation = document.getElementById('total-information')

    const title = document.getElementById('activity-title')
    if (activityRecordId) {
        isEdit = true
        title.innerText = '운동 기록 수정'

        // 겟요청 로직 나중에 짜기
    }

    initializeDateInput()

    // 운동 검색 버튼
    if (exerciseSearchBtn) {
        exerciseSearchBtn.addEventListener('click', async () => {
            await handleExerciseSearch()
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
            if (event.target.classList.contains('duration-minutes-input') || event.target.classList.contains('set-input')) {
                calculateTotalExerciseInformation()
            }
        })
    }


    if (activityForm) {
        activityForm.addEventListener('keydown', (event) => {
            // 검색 입력창에서만 엔터 동작
            if (event.key === 'Enter') {
                event.preventDefault()
                const searchStr = exerciseSearchInput.value
                if (searchStr.length > 0) {
                    handleExerciseSearch(searchStr)
                }
            }
        })

        activityForm.addEventListener('submit', handleActivityRecordCreate)
    }
    calculateTotalExerciseInformation()
});