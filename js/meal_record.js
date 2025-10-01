import { formatDateTime } from "./utils.js"
let dateInput, prevDayBtn, nextDayBtn
let breakfastDiv, lunchDiv, snackDiv, dinnerDiv, otherDiv
let recordId

// 오늘 날짜로 초기값 세팅
async function initializeDateInput(date = new Date()) {
    console.log('연걸')
    const formattedDate = formatDateTime(date)
    dateInput.value = formattedDate.date

    const mealRecordsData = await getMealRecords(formattedDate.date)

    if (mealRecordsData) {
        console.log('초기 식단 불러오기 성공')
        loadMealAccordionUI(mealRecordsData)
    } else {
        console.log('초기 식단 불러오기 실패')
        loadMealAccordionUI({})
    }
}



// 날짜 변경
async function changeDate(offset) {
    const currentDateStr = dateInput.value
    const currentSelectedDate = new Date(currentDateStr)

    currentSelectedDate.setDate(currentSelectedDate.getDate() + offset)

    await initializeDateInput(currentSelectedDate)
}



function loadMealAccordionUI(mealRecordData) {
    const mealTypeSections = {
        'breakfast': breakfastDiv,
        'lunch': lunchDiv,
        'snack': snackDiv,
        'dinner': dinnerDiv,
        'other': otherDiv
    }

    // 초기화
    initializeAccordion(mealTypeSections)

    // 아코디언에 동적으로 데이터 채우기
    populateAccordionSections(mealRecordData, mealTypeSections)
}

// 기존 ui 초기화
function initializeAccordion(mealTypeSections) {
    Object.values(mealTypeSections).forEach(section => {
        if (section) section.innerHTML = ''
    })
}


// 아코디언 데이터로 채우기
function populateAccordionSections(mealRecordData, mealTypeSections) {
    const mealTypeOrder = ['breakfast', 'lunch', 'snack', 'dinner', 'other']

    for (const typeKey of mealTypeOrder) {
        const recordByType = mealRecordData[typeKey]
        const targetSection = mealTypeSections[typeKey]
        const currentDiv = targetSection

        if (currentDiv && recordByType && recordByType.length > 0) {
            let recordTime
            let memo
            let totalCalories = 0
            let totalCarbs = 0
            let totalProtein = 0
            let totalFat = 0
            let totalSugars = 0
            let totalFiber = 0
            const fragment = document.createDocumentFragment()

            // Div 1. :  시간, 영양성분, 메모, 수정&삭제 버튼 추가
            recordByType.forEach(record => {
                recordId = record.id
                totalCalories += parseFloat(record.total_meal_calories) || 0
                totalCarbs += parseFloat(record.total_meal_carbs) || 0
                totalProtein += parseFloat(record.total_meal_protein) || 0
                totalFat += parseFloat(record.total_meal_fat) || 0
                totalSugars += parseFloat(record.total_meal_sugars) || 0
                totalFiber += parseFloat(record.total_meal_fiber) || 0

                recordTime = new Date(record.time)
                const hours = String(recordTime.getHours()).padStart(2, '0')
                const minutes = String(recordTime.getMinutes()).padStart(2, '0')
                recordTime = `${hours}시 ${minutes}분`
                memo = record.notes ? record.notes.trim() : ''

                const mealSummarySection = document.createElement('div')
                mealSummarySection.classList.add('meal-summary-section', 'card', 'card-body', 'mb-3', 'p-3', 'bg-warning-subtle', 'border', 'rounded')

                mealSummarySection.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <!-- 식사 시간/메모 예시 -->
                        <h5 class="mb-0 text-dark fw-bold">
                            ${recordTime}
                        </h5>

                        <!-- 수정/삭제 버튼 -->
                        <div class="meal-actions btn-group">
                            <button type="button" class="btn btn-outline-success btn-sm"
                                onclick="window.location.href='meal_form.html?id=${recordId}'">
                                수정 <i class="bi bi-pencil-square"></i>
                            </button>
                            <button type="button" class="btn btn-outline-danger btn-sm ms-1 delete-record-btn" data-record-id="${recordId}">
                                삭제 <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>

                    <!-- 전체 끼니의 총 영양성분 -->
                    <div class="d-flex flex-column mb-3">
                        <h5 class="text-success mb-1">
                            총 ${totalCalories.toFixed(1) || 0} kcal
                        </h5>
                        <p class="text-secondary text-muted small mb-0">
                            탄: ${totalCarbs.toFixed(1) || 0}g | 단: ${totalProtein.toFixed(1) || 0}g | 지: ${totalFat.toFixed(1) || 0}g
                            <span class="d-block d-md-inline-block">
                                | 당: ${totalSugars.toFixed(1) || 0}g | 섬: ${totalFiber.toFixed(1) || 0}g
                            </span>
                        </p>
                    </div>
                    <div class="meal-memo-box border border-2 rounded p-2 text-dark small bg-light-subtle">
                        <span class="d-block mt-1">${memo}</span>
                    </div>
                `
                fragment.appendChild(mealSummarySection)
                // Div 2. food_items 렌더링
                record.food_items.forEach(item => {
                    const mealCardDiv = document.createElement('div')
                    mealCardDiv.classList.add('card', 'text-bg-light', 'mb-2', 'w-100', 'food-item-card', 'border-info')

                    const cardHeader = document.createElement('div')
                    cardHeader.classList.add('card-header', 'd-flex', 'justify-content-between', 'align-items-center')

                    const cardTitle = document.createElement('span')
                    cardTitle.innerHTML = `
                    <b class="text-secondary">${item.food_name} (${parseFloat(item.quantity).toFixed(1)}${item.unit || item.base_unit}) </b>
                    `

                    cardHeader.appendChild(cardTitle)
                    mealCardDiv.appendChild(cardHeader)

                    const cardBody = document.createElement('div')
                    cardBody.classList.add('card-body')

                    const cardCalories = document.createElement('h6')
                    cardCalories.classList.add('card-title', 'mb-1')
                    cardCalories.innerHTML = `
                        총 ${parseFloat(item.total_calories_for_this_item).toFixed(1) || 0} kcal
                    `
                    const cardText = document.createElement('p')
                    cardText.classList.add('card-text', 'text-muted', 'small')
                    cardText.innerHTML = `
                    탄수화물: ${item.total_carbs_for_this_item}g | 단백질: ${item.total_protein_for_this_item}g | 지방: ${item.total_fat_for_this_item}g | 당류: ${item.total_sugars_for_this_item}g | 식이섬유: ${item.total_fiber_for_this_item}g
                    `

                    cardBody.appendChild(cardCalories)
                    cardBody.appendChild(cardText)
                    mealCardDiv.appendChild(cardBody)

                    fragment.appendChild(mealCardDiv)
                })
            })

            currentDiv.appendChild(fragment)
        } else {
            currentDiv.innerHTML = '<p class="text-muted text-center pu-3">등록된 식단이 없습니다.</p>'
        }
    }
}


// 식단 기록 삭제
async function handleDeleteRecord(recordId, recordDate) {
    const confirmed = confirm('정말 이 식단 기록을 삭제하시겠습니까?\n복원을 원하실 경우 운영자에게 문의해야 합니다.')

    if (confirmed) {
        const success = await deleteMealRecordApi(recordId)

        if (success) {
            window.showToast('식단 기록이 삭제되었습니다.', 'info')
            setTimeout(() => {
                window.location.href = `meal_record.html?date=${recordDate}`
            }, 1500)
        } else {
            window.showToast('식단 기록에 실패했습니다. 다시 시도해주세요.', 'danger')
        }
    } else {
        window.showToast('식단 기록 삭제가 취소되었습니다.', 'info')
        console.log('식단 기록 삭제 취소')
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const urlPrams = new URLSearchParams(window.location.search)
    const recordDateByUrl = urlPrams.get('date')

    dateInput = document.getElementById('meal-date')
    prevDayBtn = document.getElementById('prev-day-btn')
    nextDayBtn = document.getElementById('next-day-btn')

    breakfastDiv = document.getElementById('breakfast-accordion-body')
    lunchDiv = document.getElementById('lunch-accordion-body')
    snackDiv = document.getElementById('snack-accordion-body')
    dinnerDiv = document.getElementById('dinner-accordion-body')
    otherDiv = document.getElementById('other-accordion-body')

    // breakfastHeader = document.getElementById('breakfast-header')
    // lunchHeader = document.getElementById('lunch-header')
    // snackHeader = document.getElementById('snack-header')
    // dinnerHeader = document.getElementById('dinner-header')
    // otherHeader = document.getElementById('other-header')


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
        await initializeDateInput(selectedDate)
    })


    document.addEventListener('click', function (event) {
        const recordDate = dateInput.value
        const deleteBtn = event.target.closest('.delete-record-btn')
        if (deleteBtn) {
            const targetId = deleteBtn.dataset.recordId
            if (targetId) {
                handleDeleteRecord(targetId, recordDate)
            }

        }
    })
})