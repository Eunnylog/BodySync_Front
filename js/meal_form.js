import { formatDateTime } from "./utils.js"
const urlPrams = new URLSearchParams(window.location.search)
const mealRecordId = urlPrams.get('id')

// 식사 수정 모드 유무
let isEdit = false
let mealRecordData = null

let pageTitle
let foodCreateModal
let foodCreateForm
let bsFoodCreateModal
let foodSearchBtn
let foodSearchInput
let foodSearchResultUI
let selectedFoodsList
let mealRecordForm
let mealDateInput
let mealTimeInput
let mealNoteInput
let mealTypeSelect

// 음식 생성 모달 Input들
let foodNameInput
let foodCaloriesInput
let foodCarbsInput
let foodSugarsInput
let foodFiberInput
let foodProteinInput
let foodFatInput
let foodBaseUnitInput

// 선택된 음식의 총 영양성분 Span들
let totalCaloriesSpan
let totalCarbsSpan
let totalProteinSpan
let totalFatSpan
let totalSugarsSpan
let totalFiberSpan


// 음식 검색 및 결과 렌더링
async function performFoodSearch() {
    const searchStr = foodSearchInput.value.trim()

    if (!searchStr) {
        window.showToast('검색할 음식을 입력하세요.', 'warning')
        foodSearchResultUI.innerHTML = '<li class="list-group-item d-flex justify-content-between align-items-center"><span>검색어를 입력해주세요.</span></li>'
        return
    }

    console.log(`음식 검색 클릭! 키워드: ${searchStr}`)
    window.showToast('음식 검색 중...', 'info')

    foodSearchResultUI.innerHTML = ''

    try {
        const searchResults = await foodSearchFetch(searchStr)

        if (searchResults && searchResults.length > 0) {
            searchResults.forEach(food => {
                const li = document.createElement('li')
                li.className = 'list-group-item d-flex justify-content-between align-items-center'
                li.innerHTML = `
                <span>${food.name} (${food.calories_per_100g || 0}kcal / ${food.carbs_per_100g || 0}g / ${food.protein_per_100g || 0}g / ${food.fat_per_100g || 0}g / ${food.sugars_per_100g || 0}g / ${food.dietary_fiber_per_100g || 0}g )</span>
                <button type="button" class="btn btn-sm btn-outline-success add-food-btn"
                data-food-id="${food.id}" data-food-name="${food.name}" data-food-calories="${food.calories_per_100g}"
                data-food-carbs="${food.carbs_per_100g || 0}" data-food-sugars="${food.sugars_per_100g || 0}" data-food-fiber="${food.dietary_fiber_per_100g || 0}"
                data-food-protein="${food.protein_per_100g || 0}" data-food-fat="${food.fat_per_100g || 0}" data-food-base-unit="${food.base_unit}">추가</button>
                `

                foodSearchResultUI.appendChild(li)
            })
            window.showToast(`${searchStr}에 대한 ${searchResults.length}개의 결과를 찾았습니다.`, 'success')
        } else {
            const li = document.createElement('li')
            li.className = 'list-group-item'
            li.textContent = `${searchStr}에 대한 검색 결과가 없습니다. 직접 등록해주세요.`
            foodSearchResultUI.appendChild(li)
            window.showToast(`'${searchStr}'에 대한 검색 결과가 없습니다.`, 'info')
        }
    } catch (error) {
        console.error('음식 검색 중 오류 발생', error)
        foodSearchResultUI.innerHTML = '<p class="text-danger">음식 검색 중 오류가 발생했습니다.</p>'
        window.showToast('음식 검색 중 오류가 발생했습니다.', 'danger')
    }
}



// 선택한 음식 결과 리스트에 렌더
function addFoodItemToSelectedList(foodDetails, initialQuantity = 100, initialUnit = null) {
    const { foodId, foodName, foodCalories, foodCarbs, foodProtein, foodFat, foodSugars, foodFiber, foodBaseUnit } = foodDetails

    // 1. 중복 확인
    let isDuplicate = false
    const existingFoodItems = selectedFoodsList.querySelectorAll('.selected-food-item')
    existingFoodItems.forEach(item => {
        if (item.dataset.foodId === foodId) {
            isDuplicate = true
        }
    })

    if (isDuplicate) {
        window.showToast(`${foodName}은(는) 이미 선택된 음식입니다.`, 'warning')
        return
    }

    // 2. placeholder 제거 (선택된 음식 없을 때)
    const placeholderLi = selectedFoodsList.querySelector('li > span')
    if (placeholderLi && placeholderLi.textContent.includes('선택한 음식이 이곳에 추가됩니다.')) {
        selectedFoodsList.innerHTML = ''
    }

    // 3. 새로운 음식 선택 시 li 요소 생성 및 데이터 할당
    const selectedFoodLi = document.createElement('li')
    selectedFoodLi.className = 'list-group-item d-flex justify-content-between align-items-center selected-food-item'

    selectedFoodLi.dataset.foodId = foodId
    selectedFoodLi.dataset.foodName = foodName
    selectedFoodLi.dataset.foodCalories = foodCalories
    selectedFoodLi.dataset.foodCarbs = foodCarbs
    selectedFoodLi.dataset.foodSugars = foodSugars
    selectedFoodLi.dataset.foodFiber = foodFiber
    selectedFoodLi.dataset.foodProtein = foodProtein
    selectedFoodLi.dataset.foodFat = foodFat
    selectedFoodLi.dataset.foodBaseUnit = foodBaseUnit

    const unitOptionsHTML = []
    const availableUnits = new Set([foodBaseUnit, 'g', 'ml', '개'])

    availableUnits.forEach(unit => {
        let optionHtml = `<option value="${unit}">${unit}</option>`;
        if (unit === (initialUnit || foodBaseUnit)) {
            optionHtml = `<option value="${unit}" selected>${unit}</option>`;
        }
        unitOptionsHTML.push(optionHtml);
    })

    // 섭취량의 초기값과 단위 초기값 설정
    const displayQuantity = initialQuantity || 100

    selectedFoodLi.innerHTML = `
        <div class="input-group flex-grow-1" style="width:65%;">
            <input type="hidden" name="food_id[]" value="${foodId}">
            <span class="input-group-text text-center" style="width:30%;">${foodName}</span>
            <input type="number" name="quantity[]" class="form-control food-quantity-input" placeholder="섭취량" min="1" required value="${displayQuantity}">
            <select name="unit[]" class="form-select food-unit-select">
                ${unitOptionsHTML.join('')}
            </select>
        </div>
        <button type="button" class="btn btn-outline-danger remove-food-btn btn-sm ms-2" data-food-name="${foodName}">삭제</button>`

    selectedFoodsList.appendChild(selectedFoodLi)
    window.showToast(`${foodName}이(가) 선택되었습니다.`, 'success')
    calculateTotalMacros()
}



// 선택된 음식 삭제
function removeSelectedFoodItem(itemToRemoveElement, foodName) {
    if (!itemToRemoveElement) return

    itemToRemoveElement.remove()
    window.showToast(`${foodName}이(가) 삭제되었습니다.`, 'danger')

    calculateTotalMacros()

    if (selectedFoodsList.children.length === 0) {
        selectedFoodsList.innerHTML = `
        <li class="list-group-item d-flex justify-content-between align-items-center" id="selected-foods-placeholder">
        <span>선택한 음식이 이곳에 추가됩니다.</span>
        </li>`
    }
}




// 총 영양성분 계산
function calculateTotalMacros() {
    let totalCalories = 0
    let totalCarbs = 0
    let totalProtein = 0
    let totalFat = 0
    let totalSugars = 0
    let totalFiber = 0

    const SelectedItems = selectedFoodsList.querySelectorAll('.selected-food-item')
    console.log('계산 시작 SelectedItems', SelectedItems)

    SelectedItems.forEach(item => {
        const caloriesPer100g = parseFloat(item.dataset.foodCalories)
        const finalCaloriesPer100g = isNaN(caloriesPer100g) ? 0 : caloriesPer100g

        const carbsPer100g = parseFloat(item.dataset.foodCarbs)
        const finalCarbsPer100g = isNaN(carbsPer100g) ? 0 : carbsPer100g

        const proteinPer100g = parseFloat(item.dataset.foodProtein)
        const finalProteinPer100g = isNaN(proteinPer100g) ? 0 : proteinPer100g

        const fatPer100g = parseFloat(item.dataset.foodFat)
        const finalFatPer100g = isNaN(fatPer100g) ? 0 : fatPer100g

        const sugarsPer100g = parseFloat(item.dataset.foodSugars)
        const finalSugarsPer100g = isNaN(sugarsPer100g) ? 0 : sugarsPer100g

        const fiberPer100g = parseFloat(item.dataset.foodFiber)
        const finalFiberPer100g = isNaN(fiberPer100g) ? 0 : fiberPer100g

        const quantityInput = item.querySelector('.food-quantity-input')
        const quantity = parseFloat(quantityInput.value || 0)

        if (quantity > 0) {
            const ratio = quantity / 100

            totalCalories += finalCaloriesPer100g * ratio
            totalCarbs += finalCarbsPer100g * ratio
            totalProtein += finalProteinPer100g * ratio
            totalFat += finalFatPer100g * ratio
            totalSugars += finalSugarsPer100g * ratio
            totalFiber += finalFiberPer100g * ratio
        }
    })

    // 결과값 업데이트
    totalCaloriesSpan.textContent = totalCalories.toFixed(2)
    totalCarbsSpan.textContent = totalCarbs.toFixed(2)
    totalProteinSpan.textContent = totalProtein.toFixed(2)
    totalFatSpan.textContent = totalFat.toFixed(2)
    totalSugarsSpan.textContent = totalSugars.toFixed(2)
    totalFiberSpan.textContent = totalFiber.toFixed(2)

    console.log('계산 완료 total calories:', totalCalories)
}

// 식단 기록 수정 폼 채우기
async function populateFormForEdit(recordId) {
    const mealData = await getMealRecord(recordId)

    if (mealData) {
        mealRecordData = mealData

        // setDateTimeInputs(new Date(mealRecordData.date))
        const formatted = formatDateTime(new Date(mealRecordData.date))

        if (formatted) {
            mealDateInput.value = formatted.date
            mealTimeInput.value = formatted.time
        }

        mealNoteInput.value = mealData.notes || ''
        if (mealTypeSelect) mealTypeSelect.value = mealData.meal_type || ''

        selectedFoodsList.innerHTML = ''
        if (mealData.food_items && Array.isArray(mealData.food_items)) {
            mealData.food_items.forEach(item => {
                console.log('food_items', mealData.food_items)
                console.log('item', item)
                const foodDetails = {
                    foodId: item.food,
                    foodName: item.food_name,
                    foodCalories: item.calories_per_100g,
                    foodCarbs: item.carbs_per_100g,
                    foodProtein: item.protein_per_100g,
                    foodFat: item.fat_per_100g,
                    foodSugars: item.sugars_per_100g,
                    foodFiber: item.dietary_fiber_per_100g,
                    foodBaseUnit: item.base_unit,
                }

                addFoodItemToSelectedList(foodDetails, item.quantity, item.unit)

            })
        }
        calculateTotalMacros()
        return true
    } else {
        console.error('addFoodItemToSelectedList 식단 기록 불러오기 실패')
        window.showToast('식단 기록 불러오기 실패', 'danger')
        return false
    }
}


// 음식 생성 모달 폼 초기화
function resetFoodCreateForm() {
    if (foodNameInput) foodNameInput.value = ''
    if (foodCaloriesInput) foodCaloriesInput.value = ''
    if (foodCarbsInput) foodCarbsInput.value = ''
    if (foodProteinInput) foodProteinInput.value = ''
    if (foodFatInput) foodFatInput.value = ''
    if (foodSugarsInput) foodSugarsInput.value = ''
    if (foodFiberInput) foodFiberInput.value = ''
    if (foodBaseUnitInput) foodBaseUnitInput.value = ''
    console.log('food create modal 초기화')
}


// 음식 생성 폼 제출
async function handleFoodCreationSubmit(e) {
    e.preventDefault()

    const name = parseFloat(foodNameInput.value)
    const calories = parseFloat(foodCaloriesInput.value)
    const carbs = parseFloat(foodCarbsInput.value)
    const protein = parseFloat(foodProteinInput.value)
    const fat = parseFloat(foodFatInput.value)
    const sugars = parseFloat(foodSugarsInput.value)
    const fiber = parseFloat(foodFiberInput.value)
    const baseUnit = foodBaseUnitInput.value

    const foodData = {
        'name': name,
        'calories_per_100g': calories,
        'carbs_per_100g': carbs,
        'protein_per_100g': protein,
        'fat_per_100g': fat,
        'sugars_per_100g': sugars,
        'dietary_fiber_per_100g': fiber,
        'base_unit': baseUnit
    }

    const success = await FoodCreateFetch(foodData)
    if (success) {
        window.showToast('음식 등록 완료!', 'success')
        bsFoodCreateModal.hide()
    } else {
        window.showToast('음식 등록에 실패했습니다. 다시 시도해 주세요.', 'danger')
    }
}



// meal record 폼 제출
async function handleMealRecordSubmit(e) {
    e.preventDefault()
    console.log()

    const mealType = mealTypeSelect.value
    const mealDate = mealDateInput.value
    const mealTime = mealTimeInput.value
    const mealNote = mealNoteInput.value

    const selectedFoods = []
    const foodItems = selectedFoodsList.querySelectorAll('.selected-food-item')
    foodItems.forEach(item => {
        const foodId = item.dataset.foodId
        const quantity = parseFloat(item.querySelector('.food-quantity-input').value)
        const unit = item.querySelector('.food-unit-select').value

        selectedFoods.push({
            food: foodId,
            quantity: quantity,
            unit: unit,
        })
    })

    const submissionData = {
        meal_type: mealType,
        date: mealDate,
        time: `${mealDate}T${mealTime}:00`,
        notes: mealNote,
        foods: selectedFoods
    }


    if (isEdit) {
        const editSuccess = await updateMealRecord(submissionData, mealRecordId)

        if (editSuccess) {
            window.showToast('식단 수정 성공', 'success')
            setTimeout(() => {
                window.location.href = `meal_record.html?date=${mealDate}`
            }, 1500)
        } else {
            window.showToast('식단 수정 실패했습니다. 다시 시도해 주세요', 'danger')
        }

    } else {
        const createSuccess = await createMealRecord(submissionData)

        if (createSuccess) {
            window.showToast('식단 등록 성공', 'success')
            setTimeout(() => {
                window.location.href = `meal_record.html?date=${mealDate}`
            }, 1500)
        } else {
            window.showToast('식단 등록 실패했습니다. 다시 시도해 주세요.', 'danger')
        }
    }
}


document.addEventListener('DOMContentLoaded', async function () {
    pageTitle = document.getElementById('page-title')
    // 음식 추가 모달
    foodCreateModal = document.getElementById('food-create-modal')
    foodCreateForm = document.getElementById('food-create-form')

    foodSearchBtn = document.getElementById('food-search-btn')
    foodSearchInput = document.getElementById('food-search-input')
    foodSearchResultUI = document.getElementById('food-search-results')
    selectedFoodsList = document.getElementById('selected-foods')

    // 식단 등록 및 수정 입력창
    mealRecordForm = document.getElementById('meal-record-form')
    mealDateInput = document.getElementById('meal-date')
    mealTimeInput = document.getElementById('meal-time')
    mealNoteInput = document.getElementById('meal-note')
    mealTypeSelect = document.getElementById('meal-type')

    // 음식 생성 모달 input
    foodNameInput = document.getElementById('food-create-name')
    foodCaloriesInput = document.getElementById('food-create-calories')
    foodCarbsInput = document.getElementById('food-create-carbs')
    foodSugarsInput = document.getElementById('food-create-sugars')
    foodFiberInput = document.getElementById('food-create-fiber')
    foodProteinInput = document.getElementById('food-create-protein')
    foodFatInput = document.getElementById('food-create-fat')
    foodBaseUnitInput = document.getElementById('base-unit')

    // 선택된 음식의 영양성분
    totalCaloriesSpan = document.getElementById('total-calories')
    totalCarbsSpan = document.getElementById('total-carbs')
    totalProteinSpan = document.getElementById('total-protein')
    totalFatSpan = document.getElementById('total-fat')
    totalSugarsSpan = document.getElementById('total-sugars')
    totalFiberSpan = document.getElementById('total-fiber')


    // 식단 생성 or 수정 모드
    if (mealRecordId) {
        isEdit = true
        pageTitle.textContent = '식단 기록 수정'

        const success = await populateFormForEdit(mealRecordId)

        const formatted = formatDateTime(new Date(mealRecordData.date))

        mealDateInput.value = formatted.date
        mealTimeInput.value = formatted.time

        if (!success) {
            isEdit = false
        }
    } else {
        // pageTitle.textContent = '식단 기록 등록'
        // setDateTimeInputs()
        const formatted = formatDateTime()
        mealDateInput.value = formatted.date
        mealTimeInput.value = formatted.time

    }

    // 음식 생성 모달
    if (foodCreateModal) {
        bsFoodCreateModal = new bootstrap.Modal(foodCreateModal)
        foodCreateModal.addEventListener('hide.bs.modal', resetFoodCreateForm)
        if (foodCreateForm) {
            foodCreateForm.addEventListener('submit', handleFoodCreationSubmit)
        }
    }


    // 음식 검색 버튼
    if (foodSearchBtn) {
        foodSearchBtn.addEventListener('click', async () => {
            await performFoodSearch()
        })
    }

    // 음식 추가 버튼
    if (foodSearchResultUI) {
        foodSearchResultUI.addEventListener('click', (event) => {
            if (event.target.classList.contains('add-food-btn')) {
                const addBtn = event.target

                const foodDetails = {
                    foodId: addBtn.dataset.foodId,
                    foodName: addBtn.dataset.foodName,
                    foodCalories: addBtn.dataset.foodCalories,
                    foodProtein: addBtn.dataset.foodProtein,
                    foodFat: addBtn.dataset.foodFat,
                    foodSugars: addBtn.dataset.foodSugars,
                    foodFiber: addBtn.dataset.foodFiber,
                    foodBaseUnit: addBtn.dataset.foodBaseUnit,
                }
                addFoodItemToSelectedList(foodDetails)
            }
        })
    }


    // 선택된 음식 목록 렌더
    if (selectedFoodsList) {
        // 음식 삭제
        selectedFoodsList.addEventListener('click', (event) => {
            if (event.target.classList.contains('remove-food-btn')) {
                const itemToRemove = event.target.closest('.selected-food-item')
                if (itemToRemove) {
                    const foodName = itemToRemove.dataset.foodName
                    removeSelectedFoodItem(itemToRemove, foodName)
                }
            }

        })

        // 양 변경
        selectedFoodsList.addEventListener('change', (event) => {
            if (event.target.classList.contains('food-quantity-input') || event.target.classList.contains('food-unit-select')) {
                calculateTotalMacros()
            }
        })
    }



    // 식사 등록 폼 엔터 전송 prevent
    if (mealRecordForm) {
        mealRecordForm.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault()
            }
        })


        mealRecordForm.addEventListener('submit', handleMealRecordSubmit)
    }
    calculateTotalMacros()
})
