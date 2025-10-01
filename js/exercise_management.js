import { formatErrorMessage, getPayload } from "./utils.js"


const payload = getPayload()
let isStaff
if (payload) {
    isStaff = payload['is_staff']
    console.log(isStaff)
} else {
    console.log('payload 불러오기 실패(activity form)')
}

let exerciseListContainer, noExerciseMessage, exerciseSearchInput, exerciseSearchBtn

let paginationControls
let currentPage = 1
let totalPages = 1
let currentSearchQuery = '' // 현재 검색어를 저장하여 페이지 이동 시에도 유지
let editingExerciseId = null // 수정 중인 운동 항목의 ID를 저장할 변수

let exerciseCreateModal, exerciseCreateForm
let exerciseNameInput, exerciseCategoryInput, exerciseBaseUnitInput, exerciseCaloriesInput
let modalTitle, saveExerciseBtn
let modalModeInput // 모드 히든 인풋
let editExerciseIdInput // 수정 모드 히든 인풋

// 운동항목 로드
async function loadAndRenderExerciseList(searchQuery = '', page = 1) {
    exerciseListContainer.innerHTML = ''
    paginationControls.innerHTML = ''
    paginationControls.innerHTML = ''

    currentSearchQuery = searchQuery
    currentPage = page

    const res = await exerciseManagementSearchFetch(currentSearchQuery, currentPage)

    if (res.ok) {
        const { count, next, previous, results } = res.data

        if (results && results.length > 0) {
            results.forEach(exercise => {
                const exerciseCard = createExerciseCard(exercise)
                exerciseListContainer.appendChild(exerciseCard)
            })
        } else {
            noExerciseMessage.innerHTML = searchQuery ? `"${searchQuery}"에 대한 검색 결과가 없습니다.` : '등록된 운동 항목이 없습니다.'
            noExerciseMessage.style.display = 'block'
        }

        totalPages = Math.ceil(count / 10)
        renderPagination(count, next, previous)
    } else {
        let displayMessage = "운동 목록을 불러오는 중 오류가 발생했습니다."
        if (res.message) {
            displayMessage = res.message
        } else if (res.error) {
            const errorData = formatErrorMessage(res.error)
            if (errorData) {
                displayMessage = errorData
            }
        }
        window.showToast(displayMessage, 'danger')
        noExerciseMessage.innerText = displayMessage
        noExerciseMessage.style.display = 'block'
    }
}


// 페이지네이션 렌더링 함수
function renderPagination(count, next, previous) {
    // 항목이 없거나 1페이지이면 페이지네이션 그릴 필요 없음
    if (count == 0 || totalPages === 1) {
        paginationControls.innerHTML = ''
        return
    }

    let paginationHtml = ''

    // 1. 이전페이지 버튼
    paginationHtml += `
        <li class="page-item ${previous === null ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">이전</a>
        </li>
    `

    // 보여줄 페이지 번호 범위 계산
    const maxPagesToShow = 5 // 한번에 보여줄 페이지 번호 개수
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

    // 보여줄 페이지(endPage - startPage + 1)의 startPage 재조정 -> 보여줄 페이지를 넘으면 endPage 조정
    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // . 현재 보이는 페이지가 첫 페이지가 아니면 ---> [1] [...] 로 표기
    if (startPage > 1) {
        paginationHtml += `
        <li class="page-item">
            <a class="page-link" href="#" data-page="1">1</a>
        </li>
        <li class="page-item disabled">
            <span class="page-link">...</span>
        </li>
        `
    }

    // 현재 페이지 번호들 표시 --> [현재 페이지 번호] 렌더
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : ''
        paginationHtml += `
        <li class="page-item ${activeClass}">
            <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
        `
    }

    // 보이는 페이지 그룹의 끝이 전체 페이지보다 작으면 --> [...] [totalPages] 로 표기
    if (endPage < totalPages) {
        paginationHtml += `
        <li class="page-item disabled">
            <span class="page-link">...</span>
        </li>
        <li class="page-item">
            <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
        </li>
        `
    }

    // 다음 페이지 버튼
    paginationHtml += `
    <li class="page-item ${next === null ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage + 1}">다음</a>
    </li>
    `

    paginationControls.innerHTML = paginationHtml

    // 페이지네이션 클릭 이벤트 리스터
    paginationControls.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault()
            const pageNum = parseInt(event.target.dataset.page)
            if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages && !event.target.closest('li').classList.contains('disabled')) {
                loadAndRenderExerciseList(currentSearchQuery, pageNum)
            }
        })
    })

}


// 검색
async function handleSearch() {
    const searchStr = exerciseSearchInput.value.trim()

    if (!searchStr && exerciseSearchInput.value.length > 0) {
        window.showToast('검색할 운동명을 입력하세요', 'warning')
        return
    }

    if (searchStr === currentSearchQuery) {
        return
    }

    currentPage = 1
    currentSearchQuery = searchStr
    await loadAndRenderExerciseList(searchStr, currentPage)
    exerciseSearchInput.value = ''
}


// 운동리스트 카드
function createExerciseCard(exercise) {
    const card = document.createElement('div')
    const cardBgClass = exercise.is_deleted ? 'bg-body-secondary border-secondary' : 'border-info bg-light'
    card.className = `card management-card mb-4 border-0 border-start border-4 ${cardBgClass}`
    let editBtnHtml

    const statusBadgeHtml = exercise.is_deleted ? `<span class="badge bg-secondary ms-2">비공개</span>` : ''
    if (exercise.is_deleted) { // 비공개일 경우
        editBtnHtml = `
        <div class="btn-group btn-group-sm" role="group">
            <button type="button" class="btn btn-outline-success recover-btn" data-id="${exercise.id}">복구</button>
        </div>
        `
    } else { // 공개일 경우
        editBtnHtml = `
            <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-outline-info edit-exercise-btn" data-bs-toggle="modal"
                    data-bs-target="#exercise-modal" data-id="${exercise.id}">수정</button>
                <button type="button" class="btn btn-outline-danger" data-id="${exercise.id}">비공개</button>
            </div>
        `
    }

    const categoryBadgeClass = { 0: 'bg-primary', 1: 'bg-danger', 2: 'bg-warning' }

    card.innerHTML = `
        <div class="card-body d-flex justify-content-between align-items-center">
            <div>
                <h6 class="mb-0">${exercise.exercise_name}
                    <span class="badge ${categoryBadgeClass[exercise.category]} ms-2">${exercise.category_display}</span>
                    ${statusBadgeHtml}
                </h6>
                <p class="card-text text-muted mb-0">단위당 ${exercise.calories_per_unit}kcal | 단위: ${exercise.base_unit}</p>
            </div>
            ${editBtnHtml}
        </div>
    `
    return card

}


// 운동 항목 등록
async function handleCreateExercise(event) {
    const name = exerciseNameInput.value
    const category = exerciseCategoryInput.value
    const calories = exerciseCaloriesInput.value || 0
    const baseUnit = exerciseBaseUnitInput.value || "분"

    if (!name || category.length === 0 || !calories) {
        window.showToast('운동명, 카테고리, 칼로리는 필수 입력값입니다.', 'danger')
        return
    }

    const exerciseData = {
        "exercise_name": name,
        "category": parseInt(category),
        "calories_per_unit": parseFloat(calories),
        "base_unit": baseUnit
    }
    const res = await exerciseCreateFetch(exerciseData)

    if (res['isSuccess']) {
        showToast('운동 항목 등록 완료되었습니다.', 'success')
        setTimeout(() => {
            window.location.href = 'exercise_management.html'
        }, 1500)
    } else {
        let errorMessage = formatErrorMessage(res['res'])
        if (errorMessage === "운동 종류 with this 운동 이름 already exists.") {
            showToast('이미 등록된 운동입니다.', 'danger')
        } else {
            showToast(errorMessage, 'danger')
        }
    }
}


// 운동 비공개 -> 공개
async function handleRecoverExercise(exerciseId) {
    const isConfirmed = confirm('정말 이 항목을 복구하시겠습니까?')

    if (isConfirmed) {
        const res = await recoverExerciseFetch(exerciseId)

        if (res.ok) {
            window.showToast('복구 되었습니다.', 'success')
            setTimeout(() => {
                window.location.reload()
            }, 1500)
        } else {
            const errorMessage = formatErrorMessage(res.error)
            showToast(errorMessage, 'danger')
        }
    }
}


// 수정할 운동 항목 데이터 채우기
async function loadExerciseDetail(exerciseId) {
    const res = await getExerciseDetailFetch(exerciseId)

    if (res.ok) {
        const data = res.data
        const name = data.exercise_name
        const category = data.category
        const calories = data.calories_per_unit
        const baseUnit = data.base_unit

        exerciseNameInput.value = name
        exerciseCategoryInput.value = category
        exerciseCaloriesInput.value = calories
        exerciseBaseUnitInput.value = baseUnit
    } else {
        const message = formatErrorMessage(res.error)
        window.showToast(message, 'danger')
    }
}

// 운동 항목 수정 데이터 전송
async function handleEditExercise(exerciseId) {
    const name = exerciseNameInput.value
    const category = exerciseCategoryInput.value
    const calories = exerciseCaloriesInput.value || 0
    const baseUnit = exerciseBaseUnitInput.value || "분"

    const exerciseData = {
        "exercise_name": name,
        "category": category,
        "calories_per_unit": calories,
        "base_unit": baseUnit,
    }

    const res = await updateExerciseFetch(exerciseId, exerciseData)

    if (res.ok) {
        window.showToast('수정 완료되었습니다.', 'success')
        setTimeout(() => {
            window.location.reload()
        }, 1500)
    } else {
        const message = formatErrorMessage(res.error)
        window.showToast(message, 'danger')
    }
}


document.addEventListener('DOMContentLoaded', function () {
    exerciseListContainer = document.getElementById('exercise-list-container')
    noExerciseMessage = document.getElementById('no-exercise-message')
    exerciseSearchInput = document.getElementById('exercise-search-input')
    exerciseSearchBtn = document.getElementById('exercise-search-btn')

    paginationControls = document.getElementById('pagination-controls')
    exerciseCreateModal = document.getElementById('exercise-modal')
    exerciseCreateForm = document.getElementById('exercise-create-form')
    exerciseNameInput = document.getElementById('exercise-name-input')
    exerciseCategoryInput = document.getElementById('exercise-category-input')
    exerciseCaloriesInput = document.getElementById('exercise-calories-input')
    exerciseBaseUnitInput = document.getElementById('exercise-base-unit-input')
    modalTitle = document.getElementById('exercise-modal-label')
    saveExerciseBtn = document.getElementById('save-exercise-btn')
    modalModeInput = document.getElementById('modal-mode')
    editExerciseIdInput = document.getElementById('edit-exercise-id')


    if (exerciseListContainer && isStaff) {
        loadAndRenderExerciseList()

        // 검색
        if (exerciseSearchBtn) {
            exerciseSearchBtn.addEventListener('click', handleSearch)
        }
        if (exerciseSearchInput) {
            exerciseSearchInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault()
                    handleSearch();
                }
            })
        }
    } else {
        window.showToast('관리자만 접근 가능한 페이지입니다.')
        setTimeout(() => {
            window.location.href = 'activity_record.html'
        }, 1500)
    }



    // // 생성 & 수정 모드 분기
    // exerciseCreateForm.addEventListener('submit', async function (event) {
    //     event.preventDefault()

    //     const currentMode = modalModeInput.value

    //     if (currentMode === 'create') {
    //         await handleCreateExercise()
    //     } else if (currentMode === 'edit') {
    //         const exerciseId = editExerciseIdInput.value
    //         if (exerciseId) {
    //             await handleEditExercise(exerciseId)
    //         } else {
    //             window.showToast('수정 대상 운동 ID를 찾을 수 없습니다.')
    //         }
    //     }

    // })

    // exerciseCreateModal.addEventListener('hide.bs.modal', function () {
    //     // if (exerciseNameInput) exerciseNameInput.value = ''
    //     // if (exerciseCategoryInput) exerciseCategoryInput.value = ''
    //     // if (exerciseCaloriesInput) exerciseCaloriesInput.value = ''
    //     // if (exerciseBaseUnitInput) exerciseBaseUnitInput.value = ''

    //     exerciseCreateForm.reset()

    //     modalTitle.innerText = '새 운동 항목 등록'
    //     modalModeInput.value = 'create'
    //     editExerciseIdInput.value = ''
    //     saveExerciseBtn.innerText = '등록'
    // })



    // exerciseCreateModal.addEventListener('show.bs.modal', (event) => {
    //     const editBtn = event.relatedTarget

    //     if (editBtn && editBtn.classList.contains('edit-exercise-btn')) {
    //         const exerciseId = editBtn.dataset.id
    //         console.log(exerciseId)
    //         // 수정 모드
    //         if (exerciseId) {
    //             modalTitle.innerText = "운동 항목 수정"
    //             modalModeInput.value = 'edit'
    //             editExerciseIdInput.value = exerciseId
    //             saveExerciseBtn.innerText = '저장'
    //             loadExerciseDetail(exerciseId)
    //         }
    //     } else {
    //         // 생성 모드
    //         modalTitle.innerText = '새 운동 항목 등록'
    //         modalModeInput.value = 'create'
    //         editExerciseIdInput.value = ''
    //         saveExerciseBtn.innerText = '등록'
    //     }
    // })

    exerciseCreateModal.addEventListener('show.bs.modal', (event) => {
        const editBtn = event.relatedTarget

        // 수정 버튼 클릭 시
        if (editBtn && editBtn.classList.contains('edit-exercise-btn')) {
            const exerciseId = editBtn.dataset.id
            console.log('exerciseId', exerciseId)

            // 수정 모드
            if (exerciseId) {
                modalTitle.innerText = '운동 항목 수정'
                modalModeInput.value = 'edit'
                editExerciseIdInput.value = exerciseId
                saveExerciseBtn.innerText = '저장'

                loadExerciseDetail(exerciseId)

                // 여기에 수정 데이터 전송하는 함수 넣은면 될까???
            }
        } else {
            // 생성 모드
            modalTitle.innerText = '새 운동 항목 등록'
            modalModeInput.value = 'create'
            editExerciseIdInput.value = ''
            saveExerciseBtn.innerText = '등록'
        }
    })

    exerciseCreateModal.addEventListener('hide.bs.modal', function () {
        exerciseCreateForm.reset()

        modalTitle.innerText = '새 운동 항목 등록'
        modalModeInput.value = 'create'
        editExerciseIdInput.value = ''
        saveExerciseBtn.innerText = '등록'
    })


    exerciseCreateModal.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault()
        }
    })

    exerciseCreateForm.addEventListener('submit', async function (event) {
        event.preventDefault()

        const currentMode = modalModeInput.value

        if (currentMode === 'create') {
            await handleCreateExercise()
        } else if (currentMode === 'edit') {
            const exerciseId = editExerciseIdInput.value
            await handleEditExercise(exerciseId)
        }
    })





    // 운동 항목 복구
    exerciseListContainer.addEventListener('click', (event) => {
        const recoverBtn = event.target.closest('.recover-btn')
        if (recoverBtn) {
            const exerciseId = recoverBtn.dataset.id

            if (exerciseId) {
                event.preventDefault()
                handleRecoverExercise(exerciseId)
            }
        }
    })

})






/**
 * // =========================================================
// 5. 수정 기능 (모달 띄우고 데이터 채우기)
// =========================================================
async function handleEditButtonClick(exerciseId) {
    editingExerciseId = exerciseId; // 수정 중인 ID 저장

    // 모달 타이틀 변경
    modalTitle.innerText = '운동 항목 수정';
    saveExerciseBtn.innerText = '수정';

    // 기존 데이터 불러와서 폼 채우기
    const result = await exerciseDetailFetch(exerciseId); // exerciseDetailFetch는 `{ok: true, data: exercise}` 반환
    if (result.ok) {
        const exercise = result.data;
        exerciseNameInput.value = exercise.exercise_name;
        exerciseCategoryInput.value = exercise.category;
        exerciseCaloriesInput.value = exercise.calories_per_unit;
        exerciseBaseUnitInput.value = exercise.base_unit;
    } else {
        window.showToast(result.error || formatErrorMessage(result.errorData), 'danger');
    }
}

// =========================================================
// 6. 삭제 (소프트/영구) 기능
// =========================================================
async function handleDeleteButtonClick(exerciseId, isDeleted) { // ⭐ isDeleted 인자 추가 ⭐
    let confirmMessage;
    let successMessage;
    let failMessage;
    let apiCall;

    if (isDeleted) { // 이미 삭제된 항목 (영구 삭제)
        confirmMessage = '정말로 이 운동 항목을 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다!';
        successMessage = '운동 항목이 영구 삭제되었습니다.';
        failMessage = '운동 항목 영구 삭제에 실패했습니다.';
        // 실제 영구 삭제를 위한 API 엔드포인트가 필요할 수 있음
        // DRF는 보통 DELETE 요청 시 하드 삭제를 수행합니다.
        apiCall = exerciseDeleteFetch(exerciseId); 
    } else { // 삭제되지 않은 항목 (소프트 삭제)
        confirmMessage = '정말 이 운동 항목을 삭제(비공개)하시겠습니까? 기록에는 영향을 주지 않습니다.';
        successMessage = '운동 항목이 삭제(비공개) 처리되었습니다.';
        failMessage = '운동 항목 삭제(비공개)에 실패했습니다.';
        // is_deleted 필드만 true로 변경하는 PUT 또는 PATCH 요청 필요
        apiCall = exerciseUpdateFetch(exerciseId, { is_deleted: true }); 
    }

    if (!confirm(confirmMessage)) {
        return;
    }

    const result = await apiCall;
    if (result.ok) {
        window.showToast(successMessage, 'success');
        await loadAndRenderExerciseList(currentSearchQuery, currentPage); // 목록 새로고침
    } else {
        window.showToast(result.error || formatErrorMessage(result.errorData), 'danger');
        console.error(failMessage, result);
    }
}


// =========================================================
// 7. 운동 생성/수정 폼 제출 처리
// =========================================================
async function handleExerciseFormSubmit(event) {
    event.preventDefault();

    const name = exerciseNameInput.value;
    const category = exerciseCategoryInput.value;
    const calories = exerciseCaloriesInput.value;
    const baseUnit = exerciseBaseUnitInput.value;

    if (!name || category.length === 0 || !calories) {
        window.showToast('운동명, 카테고리, 칼로리는 필수 입력값입니다.', 'danger');
        return;
    }

    const exerciseData = {
        "exercise_name": name,
        "category": parseInt(category),
        "calories_per_unit": parseFloat(calories),
        "base_unit": baseUnit // 기본값이 없다면 이 부분은 백엔드에서 처리
    };

    let result;
    if (editingExerciseId) { // 수정 모드
        result = await exerciseUpdateFetch(editingExerciseId, exerciseData);
    } else { // 생성 모드
        result = await exerciseCreateFetch(exerciseData);
    }

    if (result.ok) {
        window.showToast(`운동 항목이 성공적으로 ${editingExerciseId ? '수정' : '등록'}되었습니다.`, 'success');
        // 모달 닫기
        const modal = bootstrap.Modal.getInstance(exerciseCreateModal) || new bootstrap.Modal(exerciseCreateModal);
        modal.hide();

        await loadAndRenderExerciseList(currentSearchQuery, currentPage); // 목록 새로고침
    } else {
        // ... 오류 처리 로직은 loadAndRenderExerciseList와 유사하게 ...
        let displayMessage = '운동 항목 처리 중 오류가 발생했습니다.';
        if (result.message) { 
            displayMessage = result.message;
        } else if (result.errorData) {
            if (typeof result.errorData === 'object' && result.errorData !== null) {
                let formattedMsg = formatErrorMessage(result.errorData);
                if (formattedMsg.trim() === '') {
                    displayMessage = result.errorData.detail || result.errorData.message || `오류 발생 (상태 코드: ${result.status})`;
                } else {
                    displayMessage = formattedMsg;
                }
            } else if (typeof result.errorData === 'string' && result.errorData.trim() !== '') {
                console.error('Raw Error Response Data:', result.errorData);
                displayMessage = `서버 오류 발생 (상태 코드: ${result.status}). 잠시 후 다시 시도해주세요.`;
            } else {
                displayMessage = `서버 응답 오류 (상태 코드: ${result.status}). 잠시 후 다시 시도해주세요.`;
            }
        }
        window.showToast(displayMessage, 'danger');
    }
}


// =========================================================
// 8. 초기화 및 이벤트 리스너 등록 (DOMContentLoaded)
// =========================================================
document.addEventListener('DOMContentLoaded', async function () {
    const payload = getPayload(); 
    const isStaff = payload ? payload.is_staff : false;

    // 관리자 권한 체크
    if (!isStaff) {
        window.showToast('관리자만 접근 가능한 페이지입니다.', 'danger');
        setTimeout(() => {
            window.location.href = 'activity_record.html'; // 비관리자라면 활동 기록 페이지로 리다이렉트
        }, 1500);
        return; // 로직 종료
    }

    // 관리자일 경우
    await loadAndRenderExerciseList(); // ⭐ 인자 없이 호출하여 전체 목록 (1페이지) 로드 ⭐

    // 검색 이벤트 리스너
    const exerciseSearchBtn = document.getElementById('exercise-search-btn');
    if (exerciseSearchBtn) {
        exerciseSearchBtn.addEventListener('click', handleSearch);
    }
    if (exerciseSearchInput) {
        exerciseSearchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleSearch();
            }
        });
    }

    // 수정/삭제 버튼 클릭 이벤트를 부모 요소에 위임
    exerciseListContainer.addEventListener('click', async (event) => {
        // 수정 버튼 클릭
        if (event.target.classList.contains('edit-exercise-btn')) {
            const exerciseId = event.target.dataset.id;
            // 모달 열기 전에 데이터를 미리 불러와서 폼에 채우기
            await handleEditButtonClick(exerciseId);
            const modal = new bootstrap.Modal(exerciseCreateModal); // 모달 인스턴스 생성
            modal.show(); // 모달 표시
        } 
        // 삭제/영구삭제 버튼 클릭
        else if (event.target.classList.contains('delete-exercise-btn')) {
            const exerciseId = event.target.dataset.id;
            const currentExercise = await exerciseDetailFetch(exerciseId); // 현재 운동 정보를 가져옴
            if (currentExercise.ok) {
                await handleDeleteButtonClick(exerciseId, currentExercise.data.is_deleted);
            } else {
                window.showToast('운동 정보 로드에 실패했습니다.', 'danger');
            }
        }
    });

    // 새 운동 등록 버튼 클릭 시 모달 초기화
    const createExerciseFromManageBtn = document.getElementById('create-exercise-from-manage-btn');
    if (createExerciseFromManageBtn) {
        createExerciseFromManageBtn.addEventListener('click', () => {
            editingExerciseId = null; // 생성 모드로 설정
            modalTitle.innerText = '새 운동 등록';
            saveExerciseBtn.innerText = '등록';
            exerciseCreateForm.reset(); // 폼 초기화
        });
    }

    // 모달 폼 제출 이벤트
    if (exerciseCreateForm) {
        exerciseCreateForm.addEventListener('submit', handleExerciseFormSubmit);
    }
});
 */