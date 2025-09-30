import { getPayload, formatDateTime } from "./utils.js"

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
let activityId
let dateInput

// 날짜, 시간
function initializeDateInput(date = new Date()) {
    // const dateTime = formatDateTime(date)
    // dateInput.value = dateTime.date
}


document.addEventListener('DOMContentLoaded', function () {
    dateInput = document.getElementById('activity-date')

    initializeDateInput()
})