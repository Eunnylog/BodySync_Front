console.log('meal_add.html')
document.addEventListener('DOMContentLoaded', function () {
    const foodCreateModal = document.getElementById('food-create-modal')
    const foodCreateForm = document.getElementById('food-create-form')
    const bsFoodCreateModal = new bootstrap.Modal(foodCreateModal)

    const foodSearchBtn = document.getElementById('food-search-btn')
    const foodSearchInput = document.getElementById('food-search-input')
    const foodSearchResultUI = document.getElementById('food-search-results')
    const selectedFoodsList = document.getElementById('selected-foods')

    const mealRecordForm = document.getElementById('meal-record-form')
    const mealDateInput = document.getElementById('meal-date')
    const mealTimeInput = document.getElementById('meal-time')
    const mealNoteInput = document.getElementById('meal-note')
    const mealTypeSelect = document.getElementById('meal-type')

    if (foodCreateModal) {
        foodCreateModal.addEventListener('hide.bs.modal', function () {
            const foodName = document.getElementById('food-create-name')
            const foodCalories = document.getElementById('food-create-calories')
            const foodCarbs = document.getElementById('food-create-carbs')
            const foodSugars = document.getElementById('food-create-sugars')
            const foodFiber = document.getElementById('food-create-fiber')
            const foodProtein = document.getElementById('food-create-protein')
            const foodFat = document.getElementById('food-create-fat')
            const foodBaseUnit = document.getElementById('base-unit')

            if (foodName) foodName.value = ""
            if (foodCalories) foodCalories.value = ""
            if (foodCarbs) foodCarbs.value = ""
            if (foodSugars) foodSugars.value = ""
            if (foodFiber) foodFiber.value = ""
            if (foodProtein) foodProtein.value = ""
            if (foodFat) foodFat.value = ""
            if (foodBaseUnit) foodBaseUnit.value = ""
        })

        // 음식 등록 후 식사 등록 모달로 돌아가기
        foodCreateForm.addEventListener('submit', async function (e) {
            e.preventDefault()

            const name = document.getElementById('food-create-name').value
            const calories = parseFloat(document.getElementById('food-create-calories').value)
            const carbs = parseFloat(document.getElementById('food-create-carbs').value)
            const sugars = parseFloat(document.getElementById('food-create-sugars').value)
            const fiber = parseFloat(document.getElementById('food-create-fiber').value)
            const protein = parseFloat(document.getElementById('food-create-protein').value)
            const fat = parseFloat(document.getElementById('food-create-fat').value)
            const baseUnit = document.getElementById('base-unit').value

            const foodData = {
                "name": name,
                "calories_per_100g": calories,
                "carbs_per_100g": carbs,
                "sugars_per_100g": sugars,
                "dietary_fiber_per_100g": fiber,
                "protein_per_100g": protein,
                "fat_per_100g": fat,
                "base_unit": baseUnit
            }

            const success = await FoodCreateFetch(foodData)

            if (success) {
                showToast('음식 등록 완료!', 'success')
                bsFoodCreateModal.hide()
            } else {
                showToast('음식 등록 실패했습니다. 다시 시도해주세요', 'danger')
            }

        })

    }

    if (foodSearchBtn) {
        foodSearchBtn.addEventListener('click', async function () {
            const searchStr = foodSearchInput.value.trim()

            if (!searchStr) {
                window.showToast('검색할 음식 값을 입력하세요.', 'warning')
                return
            }

            console.log((`음식 검색 클릭! 키워드: ${searchStr}`))
            window.showToast('음식 검색 중...', 'info')

            foodSearchResultUI.innerHTML = ""

            const searchResults = await FoodSearchFetch(searchStr)

            if (searchResults && searchResults.length > 0) {
                searchResults.forEach(food => {
                    const li = document.createElement('li')
                    li.className = 'list-group-item d-flex justify-content-between align-items-center'
                    li.innerHTML = `
                        <span>${food.name} (${food.calories_per_100g || 0}kcal / ${food.carbs_per_100g || 0}g / ${food.protein_per_100g || 0}g / ${food.fat_per_100g || 0}g / ${food.sugars_per_100g || 0}g / ${food.dietary_fiber_per_100g || 0}g )</span>
                        <button type="button" class="btn btn-sm btn-outline-success add-food-btn"
                        data-food-id="${food.id}" data-food-name="${food.name}" data-food-calories="${food.calories_per_100g}"
                        data-food-carbs="${food.carbs_per_100g}" data-food-sugars="${food.sugars_per_100g}" data-food-fiber="${food.dietary_fiber_per_100g}"
                        data-food-protein="${food.protein_per_100g}" data-food-fat="${food.fat_per_100g}" data-food-base-unit="${food.base_unit}">추가</button>
                    `
                    foodSearchResultUI.appendChild(li)
                })
                window.showToast(`'${searchStr}에 대한 ${searchResults.length}개의 결과를 찾았습니다.`, 'success')
            } else {
                const li = document.createElement('li')
                li.className = 'list-group-item'
                li.textContent = `${searchStr}에 대한 검색 결과가 업습니다. 직접 등록해주세요.`
                foodSearchResultUI.appendChild(li)
                window.showToast(`'${searchStr}에 대한 검색 결과가 없습니다.`, 'info')
            }
        })
    }

    // 음식 추가 버튼
    if (foodSearchResultUI) {
        foodSearchResultUI.addEventListener('click', function (event) {
            if (event.target.classList.contains('add-food-btn')) {
                const addBtn = event.target
                const foodId = addBtn.dataset.foodId
                const foodName = addBtn.dataset.foodName
                const foodCalories = addBtn.dataset.foodCalories
                const foodCarbs = addBtn.dataset.foodCarbs
                const foodSugars = addBtn.dataset.foodSugars
                const foodFiber = addBtn.dataset.foodFiber
                const foodProtein = addBtn.dataset.foodProtein
                const foodFat = addBtn.dataset.foodFat
                const foodBaseUnit = addBtn.dataset.foodBaseUnit

                console.log('event.target', addBtn)
                console.log(`음식 추가 버튼 클릭! ID: ${foodId}, 이름: ${foodName}`);

                // 선택된 음식 ul에 새로운 li 추가

                // 중복환인 로직
                let isDuplicate = false
                const existingFoodItems = selectedFoodsList.querySelectorAll('.selected-food-item')
                existingFoodItems.forEach(item => {
                    console.log(`foodId : ${foodId}, item.dataset.foodId: ${item.dataset.foodId}`)

                    if (item.dataset.foodId === foodId) {
                        isDuplicate = true
                    }
                })
                if (isDuplicate) {
                    window.showToast(`${foodName}은(는) 이미 선택된 음식입니다.`, 'warning')
                    return
                }

                // 1) "선택한 음식이 이곳에 추가됩니다." placeholder 제거
                const placeholderLi = selectedFoodsList.querySelector('li > span');
                if (placeholderLi && placeholderLi.textContent.includes('선택한 음식이 이곳에 추가됩니다.')) {
                    selectedFoodsList.innerHTML = ''; // ul의 내용을 비웁니다.

                }

                // 새로운 선택 음식 li 요소 생성
                const selectedFoodLi = document.createElement('li');
                selectedFoodLi.className = 'list-group-item d-flex justify-content-between align-items-center selected-food-item'


                // calculateTotalMacros가 사용할 데이터
                selectedFoodLi.dataset.foodId = foodId
                selectedFoodLi.dataset.foodName = foodName
                selectedFoodLi.dataset.foodCalories = foodCalories
                selectedFoodLi.dataset.foodCarbs = foodCarbs
                selectedFoodLi.dataset.foodSugars = foodSugars
                selectedFoodLi.dataset.foodFiber = foodFiber
                selectedFoodLi.dataset.foodProtein = foodProtein
                selectedFoodLi.dataset.foodFat = foodFat
                selectedFoodLi.dataset.foodBaseUnit = foodBaseUnit

                selectedFoodLi.innerHTML = `
                    <div class="input-group flex-grow-1" style="width:65%;">
                        <input type="hidden" name="food_id[]" value="${foodId}">
                        <span class="input-group-text text-center" style="width:30%;">${foodName}</span>
                        <input type="number" name="quantity[]" class="form-control food-quantity-input" placeholder="섭취량" min="1" required value="100">
                        <select name="unit[]" class="form-select food-unit-select">
                            <option value="${addBtn.dataset.foodBaseUnit}">${addBtn.dataset.foodBaseUnit}</option>
                            ${addBtn.dataset.foodBaseUnit !== 'g' ? '<option value="g">g</option>' : ''}
                            ${addBtn.dataset.foodBaseUnit !== 'ml' ? '<option value="ml">ml</option>' : ''}
                            ${addBtn.dataset.foodBaseUnit !== '개' ? '<option value="개">개</option>' : ''} <!-- '개' 같은 다른 단위도 추가 가능 -->
                        </select>
                    </div>
                    <button type="button" class="btn btn-outline-danger remove-food-btn btn-sm ms-2" data-food-name="${foodName}">삭제</button>
                `;
                selectedFoodsList.appendChild(selectedFoodLi)

                window.showToast(`'${foodName}'이(가) 선택되었습니다!`, 'success')

                calculateTotalMacros()

                // // 검색 결과 목록에서 선택된 음식 항목 제거 (선택 사항)
                // addButton.closest('li').remove();
            }
        })
    }

    if (selectedFoodsList) {
        selectedFoodsList.addEventListener('click', function (event) {
            if (event.target.classList.contains('remove-food-btn')) {
                const itemToRemove = event.target.closest('.selected-food-item')
                if (itemToRemove) {
                    const removeBtn = event.target
                    const foodName = removeBtn.dataset.foodName
                    console.log(foodName, 'target')
                    itemToRemove.remove()
                    window.showToast(`'${foodName}'이(가) 삭제되었습니다!`, 'danger')

                    calculateTotalMacros()

                    if (selectedFoodsList.children.length === 0) {
                        selectedFoodsList.innerHTML = `
                        <li class="list-group-item d-flex justify-content-between align-items-center" id="selected-foods-placeholder">
                        <span>선택한 음식이 이곳에 추가됩니다.</span>
                        </li>`
                    }
                }
            }
        })
    }


    // 매크로와 당류, 식이섬유 계산
    const selectedFoodList = document.getElementById('selected-foods')
    const totalCaloriesSpan = document.getElementById('total-calories')
    const totalCarbsSpan = document.getElementById('total-carbs')
    const totalProteinSpan = document.getElementById('total-protein')
    const totalFatSpan = document.getElementById('total-fat')
    const totalSugarsSpan = document.getElementById('total-sugars')
    const totalFiberSpan = document.getElementById('total-fiber')

    // 총 영양성분 계산
    function calculateTotalMacros() {
        let totalCalories = 0
        let totalCarbs = 0
        let totalProtein = 0
        let totalFat = 0
        let totalSugars = 0
        let totalFiber = 0

        const SelectedItems = selectedFoodList.querySelectorAll('.selected-food-item')
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

    // 페이지 로드 시 날짜와 시간 기본값 설정
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const date = String(today.getDate()).padStart(2, '0')

    const hours = String(today.getHours()).padStart(2, '0')
    const minutes = String(today.getMinutes()).padStart(2, '0')

    mealDateInput.value = `${year}-${month}-${date}`
    mealTimeInput.value = `${hours}:${minutes}`

    // 식사 등록 폼
    if (mealRecordForm) {
        mealRecordForm.addEventListener('submit', async function (e) {
            e.preventDefault()

            console.log('식사 등록 폼 제출 완료')

            // 1. 식사 정보 가져오기
            const mealType = mealTypeSelect.value
            const mealDate = mealDateInput.value
            const mealTime = mealTimeInput.value
            const mealNote = mealNoteInput.value

            // 2. 선택된 음식 정보
            const selectedFoods = []
            const foodItems = selectedFoodsList.querySelectorAll('.selected-food-item')
            foodItems.forEach(item => {
                const foodId = item.dataset.foodId
                const quantity = parseFloat(item.querySelector('.food-quantity-input').value)
                const unit = item.querySelector('.food-unit-select').value

                selectedFoods.push({
                    food: foodId, // foodItem.food
                    quantity: quantity, //foodItem.quantity
                    unit: unit, // foodItem.unit
                })
            })

            const submissionData = {
                meal_type: mealType, // MealRecord.meal_type
                date: mealDate, // mealRecord.date
                time: `${mealDate}T${mealTime}:00`, // mealRecord.time
                notes: mealNote, // mealRecord.note
                foods: selectedFoods, // FoodItem
            }
            console.log('서버 전송 데이터:', submissionData)

            const success = await createMealRecord(submissionData)

            if (success) {
                window.showToast('식단 기록 완료!', 'success')
                setTimeout(function () {
                    window.location.href = 'index.html'
                }, 1500)
            } else {
                window.showToast('식단 기록 실패, 다시 시도해주세요.', 'danger')
            }
        })
    }
})

