import {
    formatDateTime, formatErrorMessage, handleStartFasting,
    handleAbortFasting, handleEditFasting, handleLoadFasting
} from "./utils.js"

let startDateInput, endDateInput, filterByDateBtn, quickFilterBtns, startFastingModal
let startTimeInput, targetDurationInput, startFastingSubmitBtn
let fastingRecordsList, noFastingRecordsMessage
let endFastingModal, hiddenFastingId, editStartTimeInput, fastingNotesInput, fastingEditBtn
let editFastingNotesModal, hiddenNotesFastingId, editNotesInput, saveNotesBtn
let newFastingBtn

let isFastingInProgress = false

const today = formatDateTime(new Date())

const FASTING_STATUS_CODES = {
    BEFORE_START: 0,
    IN_PROGRESS: 1,
    COMPLETED: 2,
    ABORTED: 3

}

function setDateRange(rangeType) {
    const currentDay = new Date()
    let startDateValue, endDateValue
    endDateValue = formatDateTime(currentDay).date

    switch (rangeType) {
        case '1week':
            startDateValue = formatDateTime(new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate() - 6)).date
            break
        case '2weeks':
            startDateValue = formatDateTime(new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate() - 13)).date
            break
        case '1month':
            startDateValue = formatDateTime(new Date(currentDay.getFullYear(), currentDay.getMonth() - 1, currentDay.getDate())).date
            break
        case '3months':
            startDateValue = formatDateTime(new Date(currentDay.getFullYear(), currentDay.getMonth() - 3, currentDay.getDate())).date
            break
        case 'all':
            startDateValue = ''
            break
        default:
            startDateValue = formatDateTime(new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate() - 6)).date
            break
    }

    startDateInput.value = startDateValue
    endDateInput.value = ''
}


async function loadFastingRecords() {
    const from_date = startDateInput.value
    const to_date = endDateInput.value
    const res = await getFastingRecords(from_date, to_date)

    if (res.ok) {
        const records = res.data
        fastingRecordsList.innerHTML = ''
        if (records && records.length > 0) {
            noFastingRecordsMessage.classList.add('d-none')

            records.forEach(record => {
                if (record.status === FASTING_STATUS_CODES.IN_PROGRESS) {
                    isFastingInProgress = true
                }
                fastingRecordsList.appendChild(createFastingCard(record))
            })
        } else {
            noFastingRecordsMessage.classList.remove('d-none')
        }
    } else {
        const errorMessage = formatErrorMessage(res.error)
        window.showToast(errorMessage, 'danger')
    }
}


function createFastingCard(record) {
    // start_time과 end_time은 ISO string으로 오므로 여전히 이 함수로 포매팅합니다.
    const getFormattedTime = (isoString) => {
        if (!isoString) return '미정';
        const date = new Date(isoString);
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
    };

    // remaining_minutes (숫자)를 포맷하는 헬퍼 함수
    const formatMinutesToDisplay = (minutes) => {
        if (minutes === null || isNaN(minutes)) return ''
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        if (hours === 0) return `${remainingMinutes}분`
        if (remainingMinutes === 0) return `${hours}시간`
        return `${hours}시간 ${remainingMinutes}분`
    }

    const startTimeFormatted = record.start_time ? getFormattedTime(record.start_time) : '진행 중'
    const endTimeFormatted = record.end_time ? getFormattedTime(record.end_time) : ''


    const statusClassMap = {
        [FASTING_STATUS_CODES.BEFORE_START]: 'bg-secondary',
        [FASTING_STATUS_CODES.IN_PROGRESS]: 'bg-success',
        [FASTING_STATUS_CODES.COMPLETED]: 'bg-primary',
        [FASTING_STATUS_CODES.ABORTED]: 'bg-danger'
    };
    const statusBadgeClass = statusClassMap[record.status] || 'bg-info'

    // 남은 시간/경과 시간/예상 종료 시간 표시
    let timeInfoHtml = '';
    if (record.status === FASTING_STATUS_CODES.IN_PROGRESS) {
        // 진행 중인 경우, 경과 시간과 예상 종료 시간을
        timeInfoHtml = `
            <p class="mb-1 text-dark fw-semibold small">
                <strong>경과 시간:</strong> ${record.current_elapsed_minutes_display || 'N/A'}
            </p>
            <p class="mb-1 text-dark fw-semibold small">
                <strong>남은 시간:</strong> ${formatMinutesToDisplay(record.remaining_minutes)} 
                <span class="text-muted">(예상 종료: ${record.estimated_end_time_display || 'N/A'})</span>
            </p>
        `
    } else if (record.status === FASTING_STATUS_CODES.COMPLETED) {
        // 완료된 경우, 실제 진행 시간을
        timeInfoHtml = `
            <p class="mb-1 text-dark fw-semibold small">
                <strong>실제 진행:</strong> ${formatMinutesToDisplay(record.actual_duration_minutes)}
            </p>
        `
    } else if (record.status === FASTING_STATUS_CODES.ABORTED) {
        // 중단된 경우, 실제 진행 시간만 보여줌
        timeInfoHtml = `
            <p class="mb-1 text-dark fw-semibold small">
                <strong>진행 시간:</strong> ${formatMinutesToDisplay(record.actual_duration_minutes)}
            </p>
        `
    }

    // 상태에 따른 버튼 html
    let actionBtnHtml = ''
    const recordId = record.id

    switch (record.status) {
        // 시작 전
        case FASTING_STATUS_CODES.BEFORE_START:
            actionBtnHtml = `
            <button class="btn btn-sm btn-outline-success btn-start d-inline-flex align-items-center justify-content-center gap-1" data-id="${recordId}">시작</button>
                <button class="btn btn-sm btn-outline-info btn-edit d-inline-flex align-items-center justify-content-center gap-1" data-id="${recordId}" data-bs-toggle="modal" data-bs-target="#endFastingModal">수정</button>
                <button class="btn btn-sm btn-outline-danger btn-delete d-inline-flex align-items-center justify-content-center gap-1" data-id="${recordId}">삭제</button>
            `
            break
        case FASTING_STATUS_CODES.IN_PROGRESS:
            actionBtnHtml = `
            <button class="btn btn-sm btn-outline-primary btn-complete" data-id="${recordId}" data-bs-toggle="modal" data-bs-target="#endFastingModal">수정 및 완료</button>
            <button class="btn btn-sm btn-outline-warning btn-abort" data-id="${recordId}">중단</button>
            <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${recordId}">삭제</button>
            `
            break
        case FASTING_STATUS_CODES.COMPLETED:
        case FASTING_STATUS_CODES.ABORTED:
            actionBtnHtml = `
            <button class="btn btn-sm btn-outline-info btn-edit" data-id="${recordId}" data-bs-toggle="modal" data-bs-target="#editFastingNotesModal">수정</button>
            <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${recordId}">삭제</button>
            `
            break
    }


    const card = document.createElement('div')
    card.className = `card mb-3 shadow-sm rounded-3 border-start border-info border-3 fasting-status-${record.status}`

    card.innerHTML = `
        <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="card-title text-info fw-bold mb-0">${startTimeFormatted} ~ ${endTimeFormatted === 'N/A' ? record.status_display : endTimeFormatted}</h6>
                <span class="badge text-white ${statusBadgeClass} fs-6 px-3 py-2 rounded-pill">${record.status_display}</span>
            </div>
            <p class="mb-1 text-dark fw-semibold small">
                <strong>목표 시간:</strong> ${formatMinutesToDisplay(record.target_duration_minutes)}
            </p>
            ${timeInfoHtml}
            ${record.notes ? `<p class="text-muted small mt-2 mb-0"><strong>메모:</strong> ${record.notes}</p>` : ''}
            <p class="text-muted small mt-2 mb-0">
                <i class="bi bi-calendar-check me-1"></i>기록 생성: ${record.formatted_created_at}
                ${record.created_at !== record.updated_at ? `<br><i class="bi bi-pencil me-1"></i>최종 수정: ${record.formatted_updated_at}` : ''}
            </p>
            
            <div class="btn-action-group pt-3 mt-3 border-top border-light">
                ${actionBtnHtml}
            </div>
        </div>
    `
    return card
}


async function startFastingRightNow(recordId) {
    if (!recordId) {
        window.showToast('단식 정보를 불러올 수 없습니다.', 'danger')
        return
    }

    const confirmed = confirm('지금 단식을 시작하겠습니까?')
    if (confirmed) {
        const now = new Date()
        const formattedNow = formatDateTime(now)
        const data = {
            'start_time': `${formattedNow.date}T${formattedNow.time}:00`,
            'status': 1
        }
        const res = await editFastingFetch(data, recordId)

        if (res.ok) {
            window.showToast('단식을 시작합니다.', 'info')
            setTimeout(() => {
                window.location.reload()
            }, 1500)
        } else {
            const errorMessage = formatErrorMessage(res.error)
            window.showToast(errorMessage, 'danger')
        }
    }
}

// 노트 불러오기
async function loadFastingNotes(recordId) {
    if (!recordId) {
        window.showToast('단식 정보를 불러올 수 없습니다', 'danger')
        return
    }

    const res = await getFastingDetail(recordId)

    if (res.ok) {
        const data = res.data
        editNotesInput.value = data.notes
    } else {
        const errorMessage = formatErrorMessage(res.error)
        window.showToast(errorMessage, 'danger')
    }
}


// 노트 저장
async function saveFastingNotes() {
    const data = {
        'notes': editNotesInput.value
    }

    const res = await editFastingFetch(data, hiddenNotesFastingId.value)

    if (res.ok) {
        window.showToast('수정 완료', 'info')
        setTimeout(() => {
            window.location.reload()
        }, 1500)
    } else {
        const errorMessage = formatErrorMessage(res.error)
        window.showToast(errorMessage, 'danger')
    }
}


async function handleDeleteFasting(recordId) {
    if (!recordId) {
        window.showToast('단식 정보를 불러올 수 없습니다.', 'danger')
        return
    }

    const confirmed = confirm('단식 기록을 삭제하시겠습니까?')

    if (confirmed) {
        const res = await deleteFastingFetch(recordId)

        if (res.ok) {
            window.showToast('삭제했습니다.', 'info')
            setTimeout(() => [
                window.location.reload()
            ], 1500)
        } else {
            const errorMessage = formatErrorMessage(res.error)
            window.showToast(errorMessage, 'danger')
        }

    }
}

document.addEventListener('DOMContentLoaded', async function () {
    startDateInput = document.getElementById('startDate')
    endDateInput = document.getElementById('endDate')
    filterByDateBtn = document.getElementById('filterByDateBtn')
    quickFilterBtns = document.querySelectorAll('.quick-filter-btn')

    startFastingModal = document.getElementById('startFastingModal')
    startTimeInput = document.getElementById('start-time-input')
    targetDurationInput = document.getElementById('target-duration-input')
    startFastingSubmitBtn = document.getElementById('start-fasting-submit-btn')

    fastingRecordsList = document.getElementById('fasting-records-list')
    noFastingRecordsMessage = document.getElementById('no-fasting-records-message')

    endFastingModal = document.getElementById('endFastingModal')
    hiddenFastingId = document.getElementById('hidden-fasting-id')
    editStartTimeInput = document.getElementById('edit-start-time-input')
    fastingNotesInput = document.getElementById('notes-input')
    fastingEditBtn = document.getElementById('end-fasting-submit-btn')

    editFastingNotesModal = document.getElementById('editFastingNotesModal')
    hiddenNotesFastingId = document.getElementById('hidden-notes-fasting-id')
    editNotesInput = document.getElementById('edit-notes-input')
    saveNotesBtn = document.getElementById('save-notes-btn')

    newFastingBtn = document.getElementById('add-new-fasting-btn')


    setDateRange('1week')
    await loadFastingRecords()

    if (startFastingModal) {
        startFastingModal.addEventListener('hide.bs.modal', function () {
            startTimeInput.value = ''
            targetDurationInput.value = '16'
        })

        startFastingModal.addEventListener('show.bs.modal', function () {
            const date = today.date
            const time = today.time
            startTimeInput.value = `${date}T${time}`
            targetDurationInput.value = '16'

        })

        if (startFastingSubmitBtn) {
            startFastingSubmitBtn.addEventListener('click', handleStartFasting)
        }
    }

    // 기간 조회 버튼
    if (filterByDateBtn) {
        filterByDateBtn.addEventListener('click', () => {
            const startDate = startDateInput.value
            const endDate = endDateInput.value

            if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
                window.showToast('시작일은 종료일보다 늦을 수 없습니다.', 'danger')
                return
            }

            // 빠른 조회
            quickFilterBtns.forEach(btn => {
                btn.classList.remove('active')
                loadFastingRecords()
            })
        })
    }

    //빠른 조회 클릭 이벤트
    if (quickFilterBtns) {
        quickFilterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const range = btn.dataset.range
                setDateRange(range)
                loadFastingRecords()
            })
        })
    }

    if (fastingRecordsList) {
        fastingRecordsList.addEventListener('click', (event) => {
            const target = event.target
            const recordId = target.dataset.id
            if (!recordId) {
                return
            }

            if (target.classList.contains('btn-start')) {
                // 시작버튼
                startFastingRightNow(recordId)
            } else if (target.classList.contains('btn-abort')) {
                // 중단 버튼
                handleAbortFasting(recordId)
            } else if (target.classList.contains('btn-delete')) {
                // 삭제 버튼
                handleDeleteFasting(recordId)
            }
        })
    }

    if (endFastingModal) {
        endFastingModal.addEventListener('show.bs.modal', (event) => {
            const btn = event.relatedTarget
            const fastingId = btn.dataset.id
            hiddenFastingId.value = fastingId
            handleLoadFasting()

            fastingEditBtn.addEventListener('click', handleEditFasting)
        })

        endFastingModal.addEventListener('hide.bs.modal', function () {
            hiddenFastingId.value = ''
            editStartTimeInput.value = ''
            fastingNotesInput.value = ''

        })
    }

    if (editFastingNotesModal) {
        editFastingNotesModal.addEventListener('show.bs.modal', (event) => {
            const btn = event.relatedTarget
            const fastingId = btn.dataset.id
            hiddenNotesFastingId.value = fastingId
            loadFastingNotes(fastingId)
        })

        saveNotesBtn.addEventListener('click', saveFastingNotes)
    }

    // 진행 중인 단식 유무 -> 새 단식 등록 버튼 처리
    if (isFastingInProgress) {
        newFastingBtn.classList.add('d-none')
    } else {
        newFastingBtn.classList.remove('d-none')
    }
})

