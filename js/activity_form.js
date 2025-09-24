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
let selectedExercise, removeExerciseBtn

let exerciseItemsContainer, exerciseTemplate
let exerciseIndex = 0

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
                        칼로리: ${exercise.calories_per_unit} kcal / ${exercise.base_unit}
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

    const clone = exerciseTemplate.content.cloneNode(true)  // true: 자식까지 클론

    // 현재 항목의 인덱스 할당 및 증가
    const currentIndex = exerciseIndex++
    const exerciseDiv = clone.querySelector('.exercise-item') // 가장 바깥 div
    exerciseDiv.dataset.index = currentIndex
    exerciseDiv.dataset.id = exerciseData.id

    // name
    const selectedExerciseNameSpan = exerciseDiv.querySelector('.selected-exercise-name')
    if (selectedExerciseNameSpan) {
        selectedExerciseNameSpan.textContent = exerciseData.name
    }
    // id hidden 필드
    const exerciseIdInput = exerciseDiv.querySelector('.exercise-id-input')
    if (exerciseIdInput) {
        exerciseIdInput.value = exerciseData.id
        exerciseIdInput.name = `exercise_items_to_create[${currentIndex}].exercise`
    }
    // 각 input의 id, name
    const inputsToUpdate = [
        { selector: '#duration_minutes-0', newIdPrefix: 'duration_minutes', nameSuffix: 'duration_minutes' },
        { selector: '#sets-0', newIdPrefix: 'sets', nameSuffix: 'sets' },
        { selector: '#reps-0', newIdPrefix: 'reps', nameSuffix: 'reps' },
        { selector: '#weight-0', newIdPrefix: 'weight', nameSuffix: 'weight' },
    ]
    inputsToUpdate.forEach(item => {
        const input = exerciseDiv.querySelector(item.originalSelector)
        if (input) {
            const newId = `${item.newIdPrefix}-${currentIndex}`
            input.id = newId
            input.name = `exercise_item_to_create[${currentIndex}].${item.nameSuffix}`
            const label = exerciseDiv.querySelector(`label[for="${item.selector.replace('#', '')}"]`)
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

    // 삭제버튼
    const removeButton = exerciseDiv.querySelector('.remove-exercise-item-btn');
    if (removeButton) {
        removeButton.addEventListener('click', () => {
            exerciseDiv.remove()
            const container = document.getElementById('exerciseItemsContainer');
            if (container && container.children.length === 0) {
                container.innerHTML = '<p class="text-muted exercise-placeholder">아직 선택된 운동이 없습니다.</p>';
            }
        });
    }

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
            }
        })
    }



});