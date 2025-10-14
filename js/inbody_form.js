import { getPayload, formatDateTime, formatErrorMessage } from "./utils.js"

const payload = getPayload()
let isEdit = false

const urlPrams = new URLSearchParams(window.location.search)
const inbodyRecordId = urlPrams.get('id')

let measuredAtInput, heightInput, weightInput, muscleMassInput, fatMassInput
let inbodyRecordForm, inbodyFormTitle, submitBtn
let dateInput, timeInput


// 날짜, 시간
function initializeDateInput(date = new Date()) {
    const dateTime = formatDateTime(date)

    dateInput.value = dateTime.date
    timeInput.value = dateTime.time
}


// 인바디 정보 저장
async function handelInbodySubmit() {
    const date = dateInput.value
    const time = timeInput.value
    const height = parseFloat(heightInput.value)
    const weight = parseFloat(weightInput.value)
    const muscleMass = muscleMassInput.value ? parseFloat(muscleMassInput.value) : null
    const fatMass = fatMassInput.value ? parseFloat(fatMassInput.value) : null

    // 신장 유효성
    if (isNaN(height) || height < 30.0 || height > 250.0) {
        window.showToast('신장은 30.0cm ~ 250.0cm 사이의 값을 입력해주세요.', 'danger')
        return;
    }
    // 체중 유효성
    if (isNaN(weight) || weight < 10.0 || weight > 300.0) {
        window.showToast('체중은 10.0kg ~ 300.0kg 사이의 값을 입력해주세요.', 'danger')
        return;
    }
    // 골격근량 유효성 (선택 사항이므로 null도 허용)
    if (muscleMass !== null && (isNaN(muscleMass) || muscleMass < 0.0 || muscleMass > 200.0)) {
        window.showToast('골격근량은 0.0kg ~ 200.0kg 사이의 값을 입력해주세요. 비워둘 수 있습니다.', 'danger')
        return
    }
    // 체지방량 유효성 (선택 사항이므로 null도 허용)
    if (fatMass !== null && (isNaN(fatMass) || fatMass < 0.0 || fatMass > 150.0)) {
        window.showToast('체지방량은 0.0kg ~ 150.0kg 사이의 값을 입력해주세요. 비워둘 수 있습니다.', 'danger')
        return
    }

    const data = {
        "measured_at": `${date}T${time}:00`,
        "height": height,
        "weight": weight,
        "skeletal_muscle_mass_kg": muscleMass,
        "body_fat_mass_kg": fatMass
    }

    if (isEdit) {
        const res = await EditInbodyRecordFetch(data, inbodyRecordId)

        if (res.ok) {
            window.showToast('인바디 수정 완료', 'info')
            setTimeout(() => {
                window.location.href = `inbody_record.html`
            }, 1500)
        } else {
            const errorMessage = formatErrorMessage(res.error)
            window.showToast(errorMessage, 'danger')
        }

    } else {
        const res = await createInbodyFetch(data)

        if (res.ok) {
            window.showToast('인바디 등록 완료', 'info')
            setTimeout(() => {
                window.location.href = `inbody_record.html`
            }, 1500)
        } else {
            const errorMessage = formatErrorMessage(res.error)
            window.showToast(errorMessage, 'danger')
        }
    }
}


// 인바디 디테일 조회
async function loadInbodyRecord(recordId) {
    const res = await getInbodyRecordFetch(recordId)

    if (res.ok) {
        const record = res.data
        initializeDateInput(new Date(record.measured_at))
        heightInput.value = record.height
        weightInput.value = record.weight
        muscleMassInput.value = record.skeletal_muscle_mass_kg
        fatMassInput.value = record.body_fat_mass_kg
    } else {
        const errorMessage = formatErrorMessage(res.error)
        window.showToast(errorMessage, 'danger')
    }
}

document.addEventListener('DOMContentLoaded', function () {
    inbodyRecordForm = document.getElementById('inbodyRecordForm')
    inbodyFormTitle = document.getElementById('inbody-form-title')
    heightInput = document.getElementById('height')
    weightInput = document.getElementById('weight')
    muscleMassInput = document.getElementById('skeletalMuscleMassKg')
    fatMassInput = document.getElementById('bodyFatMassKg')
    dateInput = document.getElementById('date')
    timeInput = document.getElementById('time')
    submitBtn = document.getElementById('submit-btn')

    initializeDateInput()

    if (inbodyRecordForm) {
        inbodyRecordForm.addEventListener('click', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault()
            }
        })

        if (inbodyRecordId) {
            // 수정 모드
            isEdit = true
            inbodyFormTitle.innerText = '인바디 기록 수정'
            submitBtn.innerText = '인바디 기록 수정'
            loadInbodyRecord(inbodyRecordId)
        } else {
            inbodyFormTitle.innerText = '인바디 기록 입력'
            submitBtn.innerText = '인바디 기록 추가'
        }

        inbodyRecordForm.addEventListener('submit', (event) => {
            event.preventDefault()
            handelInbodySubmit()
        })

    }

})