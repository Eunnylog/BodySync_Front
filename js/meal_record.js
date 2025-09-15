document.addEventListener('DOMContentLoaded', function () {
    const dateInput = document.getElementById('meal-date')
    const prevDayBtn = document.getElementById('prev-day-btn')
    const nextDayBtn = document.getElementById('next-day-btn')

    const breakfastDiv = document.getElementById('breakfast-accordion-body')
    const lunchDiv = document.getElementById('lunch-accordion-body')
    const snackDiv = document.getElementById('snack-accordion-body')
    const dinnerDiv = document.getElementById('dinner-accordion-body')
    const otherDiv = document.getElementById('other-accordion-body')


    function loadMealAccordionUI(mealRecordData) {
        const sections = {
            'breakfast': breakfastDiv,
            'lunch': lunchDiv,
            'snack': snackDiv,
            'dinner': dinnerDiv,
            'other': otherDiv
        }

        Object.values(sections).forEach(div => div.innerHTML = '')

        const mealType = ['breakfast', 'lunch', 'snack', 'dinner', 'other']

        for (const mealTypeKey of mealType) {
            const recordsMealType = mealRecordData[mealTypeKey]
            if (recordsMealType && recordsMealType.length > 0) {
                // const mealCardBox = document.createElement('div')
                // mealCardBox.className = `card text-bg-light mb-2 w-100 ${mealTypeKey}-box`
                const fragment = document.createDocumentFragment()

                recordsMealType.forEach(record => {
                    console.log(record.food_items)
                    if (mealTypeKey === record.meal_type) {
                        const foodItems = record.food_items
                        foodItems.forEach(item => {
                            const mealCardDiv = document.createElement('div')
                            mealCardDiv.classList.add('card', 'text-bg-light', 'mb-2', 'w-100')

                            const cardHeader = document.createElement('div')
                            cardHeader.classList.add('card-header', 'd-flex', 'justify-content-between', 'align-items-center')
                            const cardTitle = document.createElement('span')
                            cardTitle.innerHTML = `<b class="text-primary">${item.food_name}</b> (${item.quantity}${item.base_unit})`

                            const btnDiv = document.createElement('div')
                            const editBtn = document.createElement('button')
                            editBtn.classList.add('btn', 'btn-outline-warning', 'btn-sm', 'edit-food-item-btn')
                            editBtn.setAttribute('data-record-id', record.id)
                            editBtn.setAttribute('data-food-item-id', item.id)

                            const removeBtn = document.createElement('button')
                            removeBtn.classList.add('btn', 'btn-outline-danger', 'btn-sm', 'remove-food-item-btn')
                            removeBtn.setAttribute('data-record-id', record.id)
                            removeBtn.setAttribute('data-food-item-id', item.id)
                            removeBtn.setAttribute('style', 'margin: 5px;')

                            btnDiv.appendChild(editBtn)
                            btnDiv.appendChild(removeBtn)
                            cardHeader.appendChild(cardTitle)
                            cardHeader.appendChild(btnDiv)
                            mealCardDiv.appendChild(cardHeader)

                            const cardBody = document.createElement('div')
                            cardBody.classList.add('card-body')
                            const cardCalories = document.createElement('h6')
                            cardCalories.classList.add('card-title', 'mb-1')
                            cardCalories.innerHTML = `총 ${item.total_calories_for_this_item} kcal`

                            const cardText = document.createElement('p')
                            cardText.classList.add('card-text', 'text-muted', 'small')
                            cardText.innerHTML = `탄수화물: ${item.total_carbs_for_this_item}g | 단백질: ${item.total_protein_for_this_item}g | 지방: ${item.total_fat_for_this_item}g | 당류: ${item.total_sugars_for_this_item}g | 식이섬유: ${item.total_fiber_for_this_item}g`

                            cardBody.appendChild(cardCalories)
                            cardBody.appendChild(cardText)
                            mealCardDiv.appendChild(cardBody)

                            // documentFragment에 추가
                            fragment.appendChild(mealCardDiv)
                        })
                    }
                })
                // 해당 meal type div에 appendChild
                sections[mealTypeKey].appendChild(fragment)
            }
        }
    }

    // 오늘 날짜로 초기값 세팅
    async function initializeDateInput(date = new Date()) {
        const year = String(date.getFullYear())
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const formattedDate = `${year}-${month}-${day}`
        dateInput.value = formattedDate

        const mealRecordsData = await readMealRecords(formattedDate)

        if (mealRecordsData) {
            console.log('초기 식단 불러오기 성공')
            loadMealAccordionUI(mealRecordsData)
        } else {
            console.log('초기 식단 불러오기 실패')
            loadMealAccordionUI({})
        }
    }

    initializeDateInput()

    // 날짜 변경
    async function changeDate(offset) {
        const currentDateStr = dateInput.value
        const currentSelectedDate = new Date(currentDateStr)

        currentSelectedDate.setDate(currentSelectedDate.getDate() + offset)

        await initializeDateInput(currentSelectedDate)
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
        await changeDate()
    })
})