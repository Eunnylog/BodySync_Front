import { formatDateTime, formatErrorMessage, getPayload } from "./utils.js"
const urlPrams = new URLSearchParams(window.location.search)
const mealRecordId = urlPrams.get('id')
const payload = getPayload()
let isStaff, userId
if (payload) {
    isStaff = payload['is_staff']
    userId = payload['user_id']
}
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
let foodModalTitle
let foodHiddenInput
let foodNameInput
let foodCaloriesInput
let foodCarbsInput
let foodSugarsInput
let foodFiberInput
let foodProteinInput
let foodFatInput
let foodBaseUnitInput
let curEditFoodLi = null // 수정한 음식 li

// 선택된 음식의 총 영양성분 Span들
let totalCaloriesSpan
let totalCarbsSpan
let totalProteinSpan
let totalFatSpan
let totalSugarsSpan
let totalFiberSpan

// 나의 음식
let myFoodsModal, myFoodsEmptyMessage, myFoodsList

// 음식 검색 및 결과 렌더링
async function performFoodSearch() {
    const searchStr = foodSearchInput.value.trim()

    if (!searchStr) {
        window.showToast('검색할 음식을 입력하세요.', 'warning')
        foodSearchResultUI.innerHTML = '<li class="list-group-item d-flex justify-content-between align-items-center"><span>검색어를 입력해주세요.</span></li>'
        return
    }

    foodSearchResultUI.innerHTML = ''

    // 로딩 스피너
    foodSearchBtn.disabled = true
    foodSearchResultUI.innerHTML = `
        <li class="list-group-item d-flex justify-content-center align-items-center">
            <div class="spinner-border text-info" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <span class="ms-3">음식 정보 찾는 중... 잠시만 기다려 주세요.</span>
        </li>
    `

    try {
        const searchResults = await foodSearchFetch(searchStr)

        foodSearchResultUI.innerHTML = '' // 스피너 삭제

        if (searchResults && searchResults.length > 0) {
            renderFoodResults(searchResults, searchStr)
            window.showToast(`${searchStr}에 대한 ${searchResults.length}개의 결과를 찾았습니다.`, 'info')
        } else {
            renderNoResults(searchStr)
            window.showToast(`'${searchStr}'에 대한 검색 결과가 없습니다.`, 'danger')
        }
    } catch (error) {
        foodSearchResultUI.innerHTML = '<p class="text-danger">음식 검색 중 오류가 발생했습니다.</p>'
        window.showToast('음식 검색 중 오류가 발생했습니다.', 'danger')
    } finally {
        foodSearchBtn.disabled = false
    }
}


// 음식 검색 결과 렌더
function renderFoodResults(results, searchStr) {
    results.forEach(food => {
        const li = document.createElement('li')
        li.className = 'list-group-item d-flex justify-content-between align-items-center'
        let editBtnHtml = ''
        let deleteBtnHtml = ''

        const canManage = isStaff || (food.is_custom && food.registered_by === userId)

        if (canManage) {
            editBtnHtml = `
                <button type="button" class="badge btn btn-outline-secondary btn-sm text-secondary badge-hover edit-food-btn" 
                data-id="${food.id}" data-bs-toggle="modal" data-bs-target="#food-create-modal">수정</button>
            `
            deleteBtnHtml = `
                <button type="button" class="badge btn btn-outline-danger btn-sm text-danger badge-hover delete-food-btn" 
                data-id="${food.id}">삭제</button>
            `
        }

        li.dataset.foodId = food.id
        li.dataset.foodName = food.name
        li.dataset.foodCalories = food.calories_per_100g || 0
        li.dataset.foodCarbs = food.carbs_per_100g || 0
        li.dataset.foodProtein = food.protein_per_100g || 0
        li.dataset.foodFat = food.fat_per_100g || 0
        li.dataset.foodSugars = food.sugars_per_100g || 0
        li.dataset.foodFiber = food.dietary_fiber_per_100g || 0
        li.dataset.foodBaseUnit = food.base_unit || 'g'

        li.innerHTML = `
            <div>
                <span>${food.name} (${food.calories_per_100g || 0}kcal / ${food.carbs_per_100g || 0}g / ${food.protein_per_100g || 0}g / ${food.fat_per_100g || 0}g / ${food.sugars_per_100g || 0}g / ${food.dietary_fiber_per_100g || 0}g)</span>
                ${editBtnHtml}
                ${deleteBtnHtml}
            </div>
            <button type="button" class="btn btn-sm btn-success add-food-btn"
                data-food-id="${food.id}" data-food-name="${food.name}" 
                data-food-calories="${food.calories_per_100g}" data-food-carbs="${food.carbs_per_100g || 0}" 
                data-food-sugars="${food.sugars_per_100g || 0}" data-food-fiber="${food.dietary_fiber_per_100g || 0}"
                data-food-protein="${food.protein_per_100g || 0}" data-food-fat="${food.fat_per_100g || 0}" 
                data-food-base-unit="${food.base_unit}">추가</button>
        `
        foodSearchResultUI.appendChild(li)
    })
}


function renderNoResults(searchStr) {
    const li = document.createElement('li')
    li.className = 'list-group-item'
    li.textContent = `${searchStr}에 대한 검색 결과가 없습니다. 직접 등록해주세요.`
    foodSearchResultUI.appendChild(li)
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
    window.showToast(`${foodName}이(가) 선택되었습니다.`, 'info')
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
}

// 식단 기록 수정 폼 채우기
async function populateFormForEdit(recordId) {
    const mealData = await getMealRecord(recordId)

    if (mealData) {
        mealRecordData = mealData

        const formatted = formatDateTime(new Date(mealRecordData.time))

        if (formatted) {
            mealDateInput.value = formatted.date
            mealTimeInput.value = formatted.time
        }

        mealNoteInput.value = mealData.notes || ''
        if (mealTypeSelect) mealTypeSelect.value = mealData.meal_type || ''

        selectedFoodsList.innerHTML = ''
        if (mealData.food_items && Array.isArray(mealData.food_items)) {
            mealData.food_items.forEach(item => {
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
    if (foodModalTitle) foodModalTitle.textContent = '새 음식 등록'
    if (foodHiddenInput) foodHiddenInput.value = ''
    curEditFoodLi = null
}


// 음식 생성 및 수정 폼 제출
async function handleFoodSubmit(e) {
    e.preventDefault()

    const name = foodNameInput.value
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
    const foodId = foodHiddenInput.value

    if (!foodId) {
        const success = await FoodCreateFetch(foodData)
        if (success) {
            window.showToast('음식 등록 완료!', 'info')
            bsFoodCreateModal.hide()
        } else {
            window.showToast('음식 등록에 실패했습니다. 다시 시도해 주세요.', 'danger')
        }
    } else {
        const res = await EditFoodFetch(foodData, foodId)

        if (res.ok) {
            window.showToast('음식 수정 완료!', 'info')
            if (bsFoodCreateModal) bsFoodCreateModal.hide()

            // 수정 후 li 업데이트
            if (curEditFoodLi) {
                updateFoodLi(foodData)
            }
        } else {
            const errorMessage = formatErrorMessage(res.error)
            window.showToast(errorMessage, 'danger')
        }
    }

}



// meal record 폼 제출
async function handleMealRecordSubmit(e) {
    e.preventDefault()

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
            window.showToast('식단 수정 성공', 'info')
            setTimeout(() => {
                window.location.href = `meal_record.html?date=${mealDate}`
            }, 1500)
        } else {
            window.showToast('식단 수정 실패했습니다. 다시 시도해 주세요', 'danger')
        }

    } else {
        const createSuccess = await createMealRecord(submissionData)

        if (createSuccess) {
            window.showToast('식단 등록 성공', 'info')
            setTimeout(() => {
                window.location.href = `meal_record.html?date=${mealDate}`
            }, 1500)
        } else {
            window.showToast('식단 등록 실패했습니다. 다시 시도해 주세요.', 'danger')
        }
    }
}

// 음식 삭제
async function handleDeleteFood(foodId, deleteBtn) {
    const confirmed = confirm('해당 음식을 삭제하시겠습니까? \n 삭제 시 더이상 사용할 수 없습니다.')

    if (confirmed) {
        const res = await deleteFoodFetch(foodId)

        if (res.ok) {
            if (deleteBtn) {
                const itemToRemove = deleteBtn.closest('li')
                if (itemToRemove) {
                    itemToRemove.remove()
                }
            }
            window.showToast('삭제되었습니다.', 'info')
        } else {
            const errorMessage = formatErrorMessage(res.error)
            window.showToast(errorMessage, 'danger')
        }
    }
}


// 음식 수정 모달 데이터 채우기
function loadEditFoodModal(foodData) {
    if (foodModalTitle) foodModalTitle.textContent = '음식 수정'

    foodHiddenInput.value = foodData.foodId
    foodNameInput.value = foodData.foodName
    foodCaloriesInput.value = foodData.foodCalories
    foodCarbsInput.value = foodData.foodCarbs
    foodProteinInput.value = foodData.foodProtein
    foodFatInput.value = foodData.foodFat
    foodSugarsInput.value = foodData.foodSugars
    foodFiberInput.value = foodData.foodFiber
    foodBaseUnitInput.value = foodData.foodBaseUnit
}

// 음식 수정 후 음식 li 업데이트
function updateFoodLi(foodData) {
    if (curEditFoodLi) {
        // 1. li 요소의 dataset 업데이트
        curEditFoodLi.dataset.foodName = foodData.name;
        curEditFoodLi.dataset.foodCalories = foodData.calories_per_100g;
        curEditFoodLi.dataset.foodCarbs = foodData.carbs_per_100g;
        curEditFoodLi.dataset.foodProtein = foodData.protein_per_100g;
        curEditFoodLi.dataset.foodFat = foodData.fat_per_100g;
        curEditFoodLi.dataset.foodSugars = foodData.sugars_per_100g;
        curEditFoodLi.dataset.foodFiber = foodData.dietary_fiber_per_100g;
        curEditFoodLi.dataset.foodBaseUnit = foodData.base_unit;

        const nameSpan = curEditFoodLi.querySelector('span')

        if (nameSpan) {
            nameSpan.textContent = `${foodData.name} (${foodData.calories_per_100g}kcal / ${foodData.carbs_per_100g}g / ${foodData.protein_per_100g}g / ${foodData.fat_per_100g}g / ${foodData.sugars_per_100g}g / ${foodData.dietary_fiber_per_100g}g )`
        }

    }
}


async function loadMyFoodsList() {
    myFoodsList.innerHTML = ''
    const res = await getMyFoodsListFetch()

    if (res.ok) {
        const foods = res.data.results

        if (foods.length === 0) {
            myFoodsEmptyMessage.style.display = 'block'
        } else {
            myFoodsEmptyMessage.style.display = 'none'
            foods.forEach(food => {
                const li = document.createElement('li')
                li.className = 'list-group-item d-flex justify-content-between align-items-center'
                li.dataset.foodId = food.id
                li.dataset.foodName = food.name
                li.dataset.foodCalories = food.calories_per_100g || 0
                li.dataset.foodCarbs = food.carbs_per_100g || 0
                li.dataset.foodProtein = food.protein_per_100g || 0
                li.dataset.foodFat = food.fat_per_100g || 0
                li.dataset.foodSugars = food.sugars_per_100g || 0
                li.dataset.foodFiber = food.dietary_fiber_per_100g || 0
                li.dataset.foodBaseUnit = food.base_unit || 'g'

                const editBtnHtml = `<button type="button" class="btn badge border border-secondary text-secondary edit-food-btn" data-id="${food.id}" data-bs-toggle="modal" data-bs-target="#food-create-modal">수정</button>`
                const deleteBtnHtml = `<button type="button" class="btn badge border border-danger text-danger delete-food-btn" data-id="${food.id}">삭제</button>`
                const addBtnHtml = `<button type="button" class="btn btn-sm btn-success add-food-btn"
                data-food-id="${food.id}" data-food-name="${food.name}" data-food-calories="${food.calories_per_100g}"
                data-food-carbs="${food.carbs_per_100g || 0}" data-food-sugars="${food.sugars_per_100g || 0}" data-food-fiber="${food.dietary_fiber_per_100g || 0}"
                data-food-protein="${food.protein_per_100g || 0}" data-food-fat="${food.fat_per_100g || 0}" data-food-base-unit="${food.base_unit}">추가</button>`

                li.innerHTML = `
                    <div>
                        <span>${food.name} (${food.calories_per_100g || 0}kcal / ${food.carbs_per_100g || 0}g / ${food.protein_per_100g || 0}g / ${food.fat_per_100g || 0}g / ${food.sugars_per_100g || 0}g / ${food.dietary_fiber_per_100g || 0}g )</span>
                            ${editBtnHtml}
                            ${deleteBtnHtml}
                    </div>
                    <div>
                        ${addBtnHtml}
                    </div>
                `
                myFoodsList.appendChild(li)
            })
        }
    } else {
        const errorMessage = formatErrorMessage(res.error)
        window.showToast(errorMessage, 'danger')
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
    foodModalTitle = document.getElementById('foodCreateModalLabel')
    foodHiddenInput = document.getElementById('edit-food-id-input')
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

    // 나의 음식 모달
    myFoodsModal = document.getElementById('my-foods-modal')
    myFoodsEmptyMessage = document.getElementById('my-foods-empty-message')
    myFoodsList = document.getElementById('my-custom-foods-list')

    // 식단 생성 or 수정 모드
    if (mealRecordId) {
        isEdit = true
        pageTitle.textContent = '식단 기록 수정'

        const success = await populateFormForEdit(mealRecordId)


        if (!success) {
            isEdit = false
        }
    } else {
        const formatted = formatDateTime()
        mealDateInput.value = formatted.date
        mealTimeInput.value = formatted.time

    }

    // 음식 생성 모달
    if (foodCreateModal) {
        bsFoodCreateModal = new bootstrap.Modal(foodCreateModal)
        foodCreateModal.addEventListener('hidden.bs.modal', resetFoodCreateForm)
        if (foodCreateForm) {
            foodCreateForm.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault()
                }
            })
            foodCreateForm.addEventListener('submit', handleFoodSubmit)
        }
    }


    // 음식 검색 버튼
    if (foodSearchBtn) {
        foodSearchBtn.addEventListener('click', async () => {
            await performFoodSearch()
        })

        foodSearchBtn.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
                await performFoodSearch()
            }
        })
    }

    // 음식 버튼
    if (foodSearchResultUI) {
        foodSearchResultUI.addEventListener('click', (event) => {
            // 추가 버튼
            if (event.target.classList.contains('add-food-btn')) {
                const addBtn = event.target

                const foodDetails = {
                    foodId: addBtn.dataset.foodId,
                    foodName: addBtn.dataset.foodName,
                    foodCalories: addBtn.dataset.foodCalories,
                    foodCarbs: addBtn.dataset.foodCarbs,
                    foodProtein: addBtn.dataset.foodProtein,
                    foodFat: addBtn.dataset.foodFat,
                    foodSugars: addBtn.dataset.foodSugars,
                    foodFiber: addBtn.dataset.foodFiber,
                    foodBaseUnit: addBtn.dataset.foodBaseUnit,
                }
                addFoodItemToSelectedList(foodDetails)
            }

            // 삭제 버튼
            if (event.target.classList.contains('delete-food-btn')) {
                const deleteBtn = event.target
                const foodId = deleteBtn.dataset.id

                if (foodId) {
                    handleDeleteFood(foodId, deleteBtn)
                }
            }

            // 수정 버튼
            if (event.target.classList.contains('edit-food-btn')) {
                const editBtn = event.target
                const foodId = editBtn.dataset.id
                if (foodId) {
                    const foodItem = editBtn.closest('li')

                    if (foodItem) {
                        const foodNutrition = {
                            foodId: foodItem.dataset.foodId,
                            foodName: foodItem.dataset.foodName,
                            foodCalories: foodItem.dataset.foodCalories,
                            foodCarbs: foodItem.dataset.foodCarbs,
                            foodProtein: foodItem.dataset.foodProtein,
                            foodFat: foodItem.dataset.foodFat,
                            foodSugars: foodItem.dataset.foodSugars,
                            foodFiber: foodItem.dataset.foodFiber,
                            foodBaseUnit: foodItem.dataset.foodBaseUnit,
                        }
                        curEditFoodLi = foodItem
                        loadEditFoodModal(foodNutrition)
                    }

                }
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
        mealRecordForm.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
                if (event.target.id === 'food-search-input') {
                    event.preventDefault()
                    await performFoodSearch()
                } else {
                    event.preventDefault()
                }
            }
        })


        mealRecordForm.addEventListener('submit', handleMealRecordSubmit)
    }
    calculateTotalMacros()

    if (myFoodsModal) {
        myFoodsModal.addEventListener('hidden.bs.modal', function () {
            myFoodsEmptyMessage.style.display = 'block'
            myFoodsList.innerHTML = ''

        })

        myFoodsModal.addEventListener('show.bs.modal', function () {
            loadMyFoodsList()
        })

        myFoodsModal.addEventListener('click', (event) => {
            // 추가버튼
            if (event.target.classList.contains('add-food-btn')) {
                const addBtn = event.target

                const foodDetails = {
                    foodId: addBtn.dataset.foodId,
                    foodName: addBtn.dataset.foodName,
                    foodCalories: addBtn.dataset.foodCalories,
                    foodCarbs: addBtn.dataset.foodCarbs,
                    foodProtein: addBtn.dataset.foodProtein,
                    foodFat: addBtn.dataset.foodFat,
                    foodSugars: addBtn.dataset.foodSugars,
                    foodFiber: addBtn.dataset.foodFiber,
                    foodBaseUnit: addBtn.dataset.foodBaseUnit,
                }
                addFoodItemToSelectedList(foodDetails)
            }

            // 삭제 버튼
            if (event.target.classList.contains('delete-food-btn')) {
                const deleteBtn = event.target
                const foodId = deleteBtn.dataset.id

                if (foodId) {
                    handleDeleteFood(foodId, deleteBtn)
                }
            }

            // 수정 버튼
            if (event.target.classList.contains('edit-food-btn')) {
                const editBtn = event.target
                const foodId = editBtn.dataset.id
                if (foodId) {
                    const foodItem = editBtn.closest('li')

                    if (foodItem) {
                        const foodNutrition = {
                            foodId: foodItem.dataset.foodId,
                            foodName: foodItem.dataset.foodName,
                            foodCalories: foodItem.dataset.foodCalories,
                            foodCarbs: foodItem.dataset.foodCarbs,
                            foodProtein: foodItem.dataset.foodProtein,
                            foodFat: foodItem.dataset.foodFat,
                            foodSugars: foodItem.dataset.foodSugars,
                            foodFiber: foodItem.dataset.foodFiber,
                            foodBaseUnit: foodItem.dataset.foodBaseUnit,
                        }
                        curEditFoodLi = foodItem
                        loadEditFoodModal(foodNutrition)
                    }

                }
            }
        })
    }
})
