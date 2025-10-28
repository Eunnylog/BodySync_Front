// const backend_base_url = 'http://localhost:8000'
// const frontend_base_url = "http://localhost:5500"
// const backend_base_url = 'http://127.0.0.1:8000'
const frontend_base_url = "http://127.0.0.1:5500"
const backend_base_url = "https://api.body-sync.shop";
// const frontend_base_url = "https://body-sync.shop";



let commonToastInstance;


document.addEventListener('DOMContentLoaded', function () {
    const toastElement = document.getElementById('common-toast')
    const loginModal = document.getElementById('login-modal')
    const signupModal = document.getElementById('signup-modal')
    const dashboardCards = document.getElementById('dashboard-cards')
    const loginRequiredMessage = document.getElementById('login-required-message')

    if (toastElement) {
        commonToastInstance = new bootstrap.Toast(toastElement)
    }

    // 로그인 모달 닫을 때 초기화
    if (loginModal) {
        const loginEmailField = document.getElementById('login-email')
        const loginPasswordField = document.getElementById('login-password')
        loginModal.addEventListener('hide.bs.modal', function () {
            if (loginEmailField) loginEmailField.value = "";
            if (loginPasswordField) loginPasswordField.value = "";
        });
        loginModal.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                handleSignin()
            }
        })
        loginModal.addEventListener('submit', handleSignin)
    }

    // 회원가입 모달 닫을 때 초기화
    if (signupModal) {
        signupModal.addEventListener('hide.bs.modal', function () {
            const signupEmailField = document.getElementById('signup-email');
            const signupNicknameField = document.getElementById('signup-nickname');
            const signupPasswordField = document.getElementById('signup-password');
            const signupPassword2Field = document.getElementById('signup-password2');

            if (signupEmailField) signupEmailField.value = "";
            if (signupNicknameField) signupNicknameField.value = "";
            if (signupPasswordField) signupPasswordField.value = "";
            if (signupPassword2Field) signupPassword2Field.value = "";
        });
        signupModal.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault()
            }
        })
    }

    injectNavbar();

    const payload = localStorage.getItem('payload')

    let dashboardRow = null
    if (dashboardCards) {
        dashboardRow = dashboardCards.querySelector('.row')
    }

    if (payload) {
        console.log(payload)
        if (dashboardRow) {
            dashboardRow.classList.remove('d-none')
            loadDashboardData()
        }
        if (loginRequiredMessage) {
            loginRequiredMessage.classList.add('d-none');
        }
    } else {
        if (dashboardRow) {
            dashboardRow.classList.add('d-none');
        }
        if (loginRequiredMessage) {
            loginRequiredMessage.classList.remove('d-none');
        }
    }
})


// Toast
function showToast(message, type = 'info', title = '알림') {
    if (!commonToastInstance) {
        console.log('Toast Error')
        return
    }

    const toastElement = commonToastInstance._element // Toast DOM 접근

    toastElement.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning')

    // if (type !== 'info') {
    //     toastElement.classList.add(`text-bg-${type}`)
    // }

    if (type) {
        toastElement.classList.add(`text-bg-${type}`);
    }

    document.getElementById('common-toast-title').innerText = title;
    document.getElementById('common-toast-body').innerText = message;

    commonToastInstance.show();
}


// 로그인
async function handleSignin(email = null, password = null) {
    let emailInput = document.getElementById("login-email").value
    let passwordInput = document.getElementById("login-password").value

    if (emailInput === '' || passwordInput === '') {
        window.showToast('아이디 또는 비밀번호를 입력해주세요', 'danger')
    }

    try {
        const response = await fetch(`${backend_base_url}/users/login/`, {
            headers: {
                'content-type': 'application/json',
            },
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({
                'email': emailInput,
                'password': passwordInput,
            })
        })
        if (response.status == 200) {
            showToast('로그인 되었습니다!', 'info')
            const response_json = await response.json()
            localStorage.setItem('payload', JSON.stringify(response_json.payload))
            setTimeout(function () {
                window.location.href = 'index.html'
            }, 1500)

        } else {
            const errorData = await response.json();
            let errorMessage = '로그인에 실패했습니다. 아이디 또는 비밀번호를 확인해주세요.'; // 일반적인 실패 메시지

            console.error('로그인 API 실패:', response.status, errorData); // 디버깅용

            if (response.status === 401) { // Unauthorized (인증 실패)
                // simplejwt가 기본으로 반환하는 에러 코드와 커스텀 에러 코드를 모두 확인
                if (errorData && (errorData.code === 'user_inactive' || errorData.code === 'user_inactive_account')) {
                    errorMessage = "비활성화된 계정입니다. 관리자에게 문의하거나 다시 회원가입해 주세요."
                } else if (errorData && errorData.detail) {
                    // 일반적인 401 Unauthorized (예: "No active account found with the given credentials" -> 아이디/비번 틀림)
                    errorMessage = "아이디 또는 비밀번호가 일치하지 않습니다. 다시 입력해 주세요."
                }
            } else if (response.status === 400) { // Bad Request (유효성 검사 실패, 예를 들어 시리얼라이저에 추가 유효성 로직이 있다면)
                if (typeof errorData === 'object' && errorData !== null) {
                    errorMessage = Object.values(errorData).flat().join('\n') || errorMessage; // 모든 필드 에러 합치기
                }
            } else { // 기타 5xx 등의 서버 에러
                errorMessage = `서버 오류 (${response.status}): ${errorData.detail || '알 수 없는 문제'}`
            }

            showToast(`로그인 실패: ${errorMessage}`, 'danger', '오류')
        }
    } catch (error) {
        console.log(error)
    }

}

// 회원가입
async function handleSignup() {
    let emailInput = document.getElementById('signup-email').value
    let nicknameInput = document.getElementById('signup-nickname').value
    let passwordInput = document.getElementById('signup-password').value
    let password2Input = document.getElementById('signup-password2').value

    try {
        const response = await fetch(`${backend_base_url}/users/signup/`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "email": emailInput,
                "nickname": nicknameInput,
                "password": passwordInput,
                "password2": password2Input
            })
        })
        if (response.status == 201) {
            showToast('회원가입이 완료되었습니다!', 'info', '환영합니다!')

            const signupModalElement = document.getElementById('signup-modal');
            const signupModalInstance = bootstrap.Modal.getInstance(signupModalElement); // Bootstrap Modal 인스턴스 가져오기
            if (signupModalInstance) {
                signupModalInstance.hide(); // 모달 숨기기 이벤트 트리거
            }

            setTimeout(function () {
                window.location.href = 'index.html'
            }, 1500)

        } else {
            const errorData = await response.json()
            console.log(errorData.status, errorData)

            let errorMessage = '';

            if (typeof errorData == 'object' && errorData !== null) {
                for (const key in errorData) {
                    if (Array.isArray(errorData[key])) {
                        let fieldName = key
                        switch (key) {
                            case 'email': fieldName = '이메일'; break
                            case 'nickname': fieldName = '닉네임'; break
                            case 'password': fieldName = '비밀번호'; break
                            case 'password2': fieldName = '비밀번호 확인'; break
                            case 'non_field_errors': fieldName = '오류'; break
                            default: fieldName = key;
                        }
                        errorMessage += `${fieldName}: ${errorData[key].join(', ')}\n`; // 각 에러 메시지를 한 줄로 합침
                    } else if (typeof errorData[key] === 'string') {
                        // 에러 메시지가 바로 문자열인 경우 (e.g. detail: "인증 실패")
                        errorMessage += `${errorData[key]}\n`;
                    }
                }
            }
            if (errorMessage === '') {
                if (errorData.detail) { // DRF의 detail 에러 메시지
                    errorMessage = errorData.detail;
                } else {
                    errorMessage = '회원가입 중 알 수 없는 오류가 발생했습니다.';
                }
            }

            // showToast는 한 줄 메시지에 최적화되어 있으므로, 여러 줄이면 맨 앞만 보이거나 스크롤 생길 수 있습니다.
            // 필요하다면, 에러 메시지를 더 적절한 UI(예: 폼 필드 아래에 직접 표시)로 보여주는 것도 좋습니다.
            showToast(errorMessage.trim(), 'danger', '회원가입 실패');
        }
    } catch (error) {
        showToast('네트워크 오류가 발생했습니다. 다시 시도해 주세요.', 'danger', '오류')
    }

}

// 로그아웃
async function handleLogout() {
    await fetch(`${backend_base_url}/users/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    showToast('로그아웃 되었습니다!', 'info')
    localStorage.removeItem('payload'); // 만약 저장해뒀다면 지움
    setTimeout(function () {
        window.location.href = 'index.html'
    }, 1500)
}


const KAKAO_CLIENT_ID = "69ffa5c0f47c5c7084def27b4dee214b"
const KAKAO_REDIRECT_URI = "https://body-sync.shop/callback_kakao.html"

const GOOGLE_CLIENT_ID = "804892791014-jesh4bfaabudi6up3b1ke554r8binvff.apps.googleusercontent.com"
const GOOGLE_REDIRECT_URI = "https://body-sync.shop/callback_google.html"



// 카카오 로그인
async function kakaoLogin() {
    const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code`
    window.location.href = KAKAO_AUTH_URL
}


// 구글 로그인
function googleLogin() {
    // 구글 로그인 구현 시
    const GOOGLE_AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email&access_type=offline&include_granted_scopes=true&response_type=code&state=security_token%3D1%26url%3Dhttps://oauth2.example.com/callback&redirect_uri=${GOOGLE_REDIRECT_URI}&client_id=${GOOGLE_CLIENT_ID}`;
    window.location.href = GOOGLE_AUTH_URL;
}


// 대시보드 데이터
async function loadDashboardData() {
    try {
        const response = await authFetch(`${backend_base_url}/users/dashboard/`, {
            method: 'GET',
        })

        if (response.ok) {
            const data = await response.json()
            return { ok: true, data: data }
        } else {
            const errorData = await response.json()
            return { ok: false, error: errorData }
        }

    } catch (error) {
        console.log('네트워크 오류', error)
        return { ok: false, error: error }
    }
}


async function fetchUserProfile() {
    const url = `${backend_base_url}/users/`
    const response = await authFetch(url, { method: 'GET' })

    if (response && response.ok) {
        const userData = await response.json()
        console.log(userData)
        return userData
    } else {
        console.log('사용자 정보 불러오기 실패')
        return null
    }
}


// 마이페이지 수정
async function updateProfile(data) {
    try {
        const response = await authFetch(`${backend_base_url}/users/`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        })
        if (response.ok) {
            const updateUserData = await response.json()

            const currentPayload = JSON.parse(localStorage.getItem('payload'))
            const newPayload = { ...currentPayload } // 복시


            if (updateUserData.nickname) newPayload.nickname = updateUserData.nickname
            localStorage.setItem('payload', JSON.stringify(newPayload))
            injectNavbar()
            return true
        } else {
            const errorData = await response.json()
            console.log(errorData)
            showToast('프로필 수정 실패', 'danger')
            return false
        }
    } catch (e) {
        console.log('네트워크에러', e)
        return false
    }
}


// 회원 탈퇴
async function deleteUser() {
    try {
        const response = await authFetch(`${backend_base_url}/users/`, {
            method: 'DELETE',
        })

        if (response.status == 204) {
            return true
        } else {
            const errorData = await response.json()
            console.log('회원 탍퇴 실패', errorData)
            return false
        }
    } catch (error) {
        console.log('네트워크 오류', error)
        return false
    }
}


// 비밀번호 변경
async function changePassword(data) {
    try {
        const response = await authFetch(`${backend_base_url}/users/password-change/`, {
            method: 'POST',
            body: JSON.stringify(data)
        })

        if (response.ok) {
            return true
        } else {
            let errorData = null; // 파싱된 에러 데이터 또는 텍스트
            let errorMessage = '비밀번호 변경에 실패했습니다.'; // 기본 메시지

            try {
                errorData = await response.json();
            } catch (parseError) {
                console.warn('비밀번호 변경: 에러 응답 본문이 JSON 형식이 아님:', parseError);
                errorData = await response.text(); // 텍스트로 파싱
            }

            errorMessage = Object.values(errorData).flat().join('\n')

            if (response.status === 401) {
                showToast(errorMessage, 'danger')
                console.log(1, errorMessage)
            } else if (response.status === 400) {
                showToast(errorMessage, 'danger')
                console.log(2, errorMessage)
            } else {
                showToast(errorMessage, 'danger')
                console.log(3, errorMessage)
            }
            return false
        }
    } catch (error) {
        console.error('비밀번호 변경 네트워크 오류 (fetch 실패):', error);
        showToast('네트워크 오류가 발생했습니다. 다시 시도해 주세요.', 'danger', '네트워크 오류');
        return false
    }
}


// access token 재발급
async function tokenRefresh() {
    try {
        const response = await fetch(`${backend_base_url}/users/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        })
        if (response.status === 200) {
            if (typeof injectNavbar === 'function') { // 함수가 정의되어 있는지 확인 후 호출
                injectNavbar();
            }
            console.log('access token 재발급 성공')
            return true
        } else {
            const errorData = await response.json()
            console.log('access token 재발급 실패', response.status)
            showToast('세션이 만료되었습니다. 다시 로그인해주세요.', 'danger')
            await handleLogout()
            return false
        }
    } catch (error) {
        console.log('네트워크 오류', error)
        showToast('네트워크 오류가 발생했습니다. 다시 로그인해주세요', 'danger')
        await handleLogout()
        return false
    }
}


// access token 만료 확인 후 재발급 시도
async function handleAccessTokenExpiration(response, originalRequestFn) {
    let errorData = null

    const contentType = response.headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')

    if (isJson && response.status !== 204) {
        try {
            errorData = await response.clone().json()
        } catch (e) {
            console.warn('handleAccessTokenExpiration 오류', e)
            return response
        }
    }

    const expired = response.status === 401 && (
        errorData?.detail === "Authentication credentials were not provided." || // 브라우저: 쿠키 없음
        errorData?.code === "token_not_valid" ||                                // 만료 토큰 있음
        errorData?.messages?.some(m => m.message === "Token is expired")       // 메시지 기반 확인
    )


    if (expired) {
        console.log('access token 만료 감지, 재발급 시도 중')
        const refreshSuccess = await tokenRefresh()

        if (refreshSuccess) {
            console.log('access token 재발급 성공! 원래 요청 재시도')
            return await originalRequestFn()
        } else {
            console.log('access token 재발급 실패')
            return null
        }
    }

    return response
}


// 모든 fetch 요청을 감싸는 공통 함수(access token 만료 시 자동으로 발급 처리해줌)
async function authFetch(url, options = {}) {
    // fetch를 실제로 실행하는 함수
    const actualFetchRequest = async () => {
        return await fetch(url, {
            ...options,
            credentials: 'include', // 쿠키 항상 포함
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        })
    }

    // 1차 요청
    let response = await actualFetchRequest()

    // 만료 확인 및 refresh 처리
    response = await handleAccessTokenExpiration(response, actualFetchRequest)

    return response
}


// 음식 등록
async function FoodCreateFetch(data) {
    try {
        const response = await authFetch(`${backend_base_url}/meals/foods/`, {
            method: 'POST',
            body: JSON.stringify(data)
        })
        if (response.ok) {
            const response_json = await response.json()
            console.log(response_json)
            return true
        } else {
            const errorData = await response.json()
            console.log(errorData)
            return false
        }
    } catch (error) {
        console.log('네트워크 오류', error)
        return false
    }
}

// 음식 검색
async function foodSearchFetch(searchStr) {
    try {
        const response = await authFetch(`${backend_base_url}/meals/foods/?food-search=${encodeURIComponent(searchStr)}`, {
            method: 'GET',
        })

        if (response.ok) {
            const data = await response.json()
            console.log('음식 검색 성공', data)
            return data
        } else {
            const errorData = await response.json()
            console.log('음식 검색 실패', errorData)
            return null
        }
    } catch (error) {
        console.error('네트워크 오류', error)
        window.showToast('네트워크 오류 발생', 'danger')
        return null
    }
}


// 음식 삭제
async function deleteFoodFetch(foodId) {
    try {
        const response = await authFetch(`${backend_base_url}/meals/foods/${foodId}/`, {
            method: 'DELETE',
        })

        if (response.ok) {
            return { ok: true }
        } else {
            const errorData = await response.json()
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.error('네트워크 오류', error)
        return { ok: false, error: errorData }
    }
}


// 음식 수정
async function EditFoodFetch(foodData, foodId) {
    try {
        const response = await authFetch(`${backend_base_url}/meals/foods/${foodId}/`, {
            method: 'PATCH',
            body: JSON.stringify(foodData)
        })

        if (response.ok) {
            const data = await response.json()
            return { ok: true, data: data }
        } else {
            const errorData = await response.json()
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.error('네트워크 오류', error)
        return { ok: false, error: errorData }
    }
}


// 식단 등록
async function createMealRecord(data) {
    try {
        const response = await authFetch(`${backend_base_url}/meals/meal-records/`, {
            method: 'POST',
            body: JSON.stringify(data)
        })

        if (response.ok) {
            const response_json = await response.json()
            console.log('mealRecord POST 성공', response_json)
            return true
        } else {
            const errorData = await response.json()
            console.error('mealRecord POST 실패', response_json)
            return false
        }
    } catch (error) {
        console.log('네트워크 오류', error)
        return false
    }
}

// 식단 리스트 조회
async function getMealRecords(date) {
    try {
        const response = await authFetch(`${backend_base_url}/meals/meal-records/?date=${encodeURIComponent(date)}`, {
            method: 'GET',
        })

        if (response.ok) {
            response_json = await response.json()
            console.log(response_json)
            return response_json
        } else {
            const errorData = await response.json()
            console.error('getMealRecords GET 실패', errorData)
            return null
        }
    } catch (error) {
        console.log('네트워크 오류', error)
        return null
    }
}

// 식단 디테일 조회
async function getMealRecord(mealRecordId) {
    try {
        const response = await authFetch(`${backend_base_url}/meals/meal-records/${mealRecordId}`, {
            method: 'GET'
        })

        if (response.ok) {
            const record = await response.json()
            data = {
                date: record.date,
                time: record.time,
                meal_type: record.meal_type,
                food_items: record.food_items,
                notes: record.notes,
            }
            return data
        } else {
            const errorData = response.json()
            console.log(errorData)
            return null
        }


    } catch (error) {
        console.log('네트워크 오류', error)
        return null
    }
}



// meal record Patch
async function updateMealRecord(data, mealRecordId) {
    try {
        const response = await authFetch(`${backend_base_url}/meals/meal-records/${mealRecordId}/`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        })

        if (response.ok) {
            const response_json = await response.json()
            console.log(response_json)
            return true
        } else {
            const errorData = await response.json()
            console.log(errorData)
            return false
        }
    } catch (error) {
        console.log('네트워크 오류', error)
        return false
    }
}


// meal record delete
async function deleteMealRecordApi(recordId) {
    try {
        const response = await authFetch(`${backend_base_url}/meals/meal-records/${recordId}/`, {
            method: 'DELETE'
        })

        if (response.ok) {
            return true
        } else {
            const errorData = await response.json()
            console.error(errorData.message)
            return false
        }
    } catch (error) {
        console.error(error)
        return false
    }
}


// 운동 검색
async function exerciseSearchFetch(searchStr) {
    try {
        const response = await authFetch(`${backend_base_url}/activities/exercises/?exercise-search=${encodeURIComponent(searchStr)}`, {
            method: 'GET',
        })

        if (response.ok) {
            const data = await response.json()
            return { ok: true, data: data }
        } else {
            const errorData = await response.json()
            console.error(errorData.message)
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.error(error)
        return { ok: false, error: `네트워크오류: ${error}` }
    }
}


// 운동 기록 생성
async function activityRecordCreateFetch(data) {
    try {
        const response = await authFetch(`${backend_base_url}/activities/activity-records/`, {
            method: 'POST',
            body: JSON.stringify(data)
        })

        if (response.ok) {
            const response_json = await response.json()
            console.log(response_json)
            return null
        } else {
            const errorData = await response.json()
            return errorData
        }
    } catch (error) {
        console.log('네트워크 오류', error)
        return error
    }
}


// 운동 항목 생성
async function exerciseCreateFetch(data) {
    try {
        const response = await authFetch(`${backend_base_url}/activities/exercises/`, {
            method: 'POST',
            body: JSON.stringify(data)
        })

        if (response.ok) {
            const response_json = await response.json()
            return { 'isSuccess': true, 'res': response_json }
        } else {
            const errorData = await response.json()
            return { 'isSuccess': false, 'res': errorData }
        }
    } catch (error) {
        return { 'isSuccess': false, 'res': error }

    }
}

// 관리자 페이지 운동 항목 조회
async function exerciseManagementSearchFetch(searchStr = '', page = 1) {
    try {
        let queryStr = `?page=${page}`
        if (queryStr) {
            queryStr += `&exercise-search=${encodeURIComponent(searchStr)}`
        }

        const response = await authFetch(`${backend_base_url}/activities/exercises/admin_list/${queryStr}`, {
            method: 'GET',
        })

        if (response.ok) {
            const data = await response.json().catch(() => ({}))
            return { ok: true, data: data }
        } else {
            const errorData = await response.json().catch(() => response.text())
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.log('exerciseManagement 네트워크오류', error)
        return { ok: false, error: error }
    }
}


// 운동 항목 복구
async function recoverExerciseFetch(exerciseId) {
    try {
        const response = await authFetch(`${backend_base_url}/activities/exercises/recover/${exerciseId}/`, {
            method: 'PATCH',
        })

        if (response.ok) {
            const response_json = await response.json()
            console.log(response_json)
            return { ok: true, data: response_json }
        } else {
            const errorData = await response.json()
            console.error(errorData)
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.error('네트워크 오류', error)
        return { ok: true, error: error }
    }
}

// 운동 항목 디테일 조회
async function getExerciseDetailFetch(exerciseId) {
    try {
        const response = await authFetch(`${backend_base_url}/activities/exercises/${exerciseId}/`, {
            method: 'GET',
        })

        if (response.ok) {
            const response_json = await response.json()
            console.log(response_json)
            return { ok: true, data: response_json }
        } else {
            const errorData = await response.json()
            console.error(errorData)
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.error('네트워크오류', error)
        return { ok: false, error: error }
    }

}

// 운동 항목 수정 전송
async function updateExerciseFetch(exerciseId, exerciseData) {
    try {
        const response = await authFetch(`${backend_base_url}/activities/exercises/${encodeURIComponent(exerciseId)}/`, {
            method: 'PATCH',
            body: JSON.stringify(exerciseData)
        })

        if (response.ok) {
            const response_json = await response.json()
            console.log(response_json)
            return { ok: true, data: response_json }
        } else {
            const errorData = await response.json()
            console.error(errorData)
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.error('네트워크오류', error)
        return { ok: false, error: error }
    }
}


// 운동 항목 삭제
async function deleteExerciseFetch(exerciseId) {
    try {
        const response = await authFetch(`${backend_base_url}/activities/exercises/${exerciseId}/`, {
            method: 'DELETE',
        })

        if (response.ok) {
            return { ok: true, }
        } else {
            const errorData = await response.json()
            console.error(errorData)
            return { ok: false, error: errorData }
        }

    } catch (error) {
        console.error('네트워크오류', error)
        return { ok: false, error: error }
    }
}


// 운동 기록 조회
async function getActivityRecordFetch(date) {
    try {
        const response = await authFetch(`${backend_base_url}/activities/activity-records/?date=${encodeURIComponent(date)}`, {
            method: 'GET',
        })

        if (response.ok) {
            const data = await response.json()
            console.log(data)
            return { ok: true, data: data }
        } else {
            const errorData = await response.json()
            console.error(errorData)
            return { ok: false, error: errorData }
        }

    } catch (error) {
        console.error('네트워크 오류', error)
        return { ok: false, error: error }
    }
}


// 운동 기록 삭제
async function deleteActivityRecordFetch(recordId) {
    try {
        const response = await authFetch(`${backend_base_url}/activities/activity-records/${recordId}/`, {
            method: 'DELETE',
        })

        if (response.ok) {
            return { ok: true }
        } else {
            const errorData = await response.json()
            console.error(errorData)
            return { ok: false, error: errorData }
        }

    } catch (error) {
        console.error('네트워크 오류', error)
        return { ok: false, error: error }
    }
}


// 운동 기록 디테일 불러오기
async function getActivityRecordDetail(recordId) {
    try {
        const response = await authFetch(`${backend_base_url}/activities/activity-records/${recordId}/`, {
            method: 'GET',
        })

        if (response.ok) {
            const data = await response.json()
            console.log(data)
            return { ok: true, data: data }
        } else {
            const errorData = await response.json()
            console.error(errorData)
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.error('네트워크 오류', error)
        return { ok: false, error: error }
    }
}


// 운동 기록 수정
async function activityRecordEditFetch(activityRecordData, activityRecordId) {
    try {
        const response = await authFetch(`${backend_base_url}/activities/activity-records/${activityRecordId}/`, {
            method: 'PATCH',
            body: JSON.stringify(activityRecordData)
        })

        if (response.ok) {
            const data = await response.json()
            console.log(data)
            return { ok: true, data: data }
        } else {
            const errorData = await response.json()
            console.log(errorData)
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.log('네트워크 오류', error)
        return { ok: false, error: error }
    }
}


// 운동 항목 수정
async function editExerciseItemFetch(recordId, itemId, data) {
    try {
        const response = await authFetch(`${backend_base_url}/activities/activity-records/${recordId}/exercise-items/${itemId}/`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        })

        if (response.ok) {
            const data = await response.json()
            console.log(data)
            return { ok: true, data: data }
        } else {
            const errorData = await response.json()
            console.log(errorData)
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.log('네트워크 오류', error)
        return { ok: true, error: error }
    }
}


// 운동 아이템 삭제
async function deleteExerciseItemFetch(recordId, itemId) {
    try {
        const response = await authFetch(`${backend_base_url}/activities/activity-records/${recordId}/exercise-items/${itemId}/`, {
            method: 'DELETE',
        })

        if (response.ok) {
            return { ok: true }
        } else {
            const errorData = await response.json()
            console.log(errorData)
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.log('네트워크 오류', error)
        return { ok: false, error: error }
    }
}


// 인바디 생성
async function createInbodyFetch(data) {
    try {
        const response = await authFetch(`${backend_base_url}/inbody/`, {
            method: 'POST',
            body: JSON.stringify(data)
        })

        if (response.ok) {
            const data = await response.json()
            console.log(data)
            return { ok: true, data: data }
        } else {
            const errorData = await response.json()
            console.log((errorData))
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.log('네트워크 오류', error)
        return { ok: false, error: error }
    }
}


// 인바디 조회
async function getInbodyRecordsFetch(startDate, endDate) {
    try {
        let apiUrl = `${backend_base_url}/inbody/`
        const params = new URLSearchParams()
        if (startDate) params.append('from_date', startDate)
        if (endDate) params.append('to_date', endDate)
        if (params.toString()) {
            apiUrl += `?${params.toString()}`
        }

        const response = await authFetch(apiUrl, { method: 'GET' })

        if (response.ok) {
            const data = await response.json()
            console.log(data)
            return { ok: true, data: data }
        } else {
            const errorData = await response.json()
            console.log((errorData))
            return { ok: false, error: errorData }
        }

    } catch (error) {
        console.log('네트워크 오류', error)
        return { ok: false, error: error }
    }
}


// 인바디 삭제
async function deleteInbodyRecordFetch(recordId) {
    try {
        const response = await authFetch(`${backend_base_url}/inbody/${recordId}/`, {
            method: 'DELETE',
        })

        if (response.ok) {
            return { ok: true }
        } else {
            const errorData = await response.json()
            console.log(errorData)
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.log('네트워크 오류', error)
        return { ok: false, error: error }
    }
}


// 인바디 디테일 조회
async function getInbodyRecordFetch(recordId) {
    try {
        const response = await authFetch(`${backend_base_url}/inbody/${recordId}/`, {
            method: 'GET',
        })

        if (response.ok) {
            const data = await response.json()
            console.log(data)
            return { ok: true, data: data }
        } else {
            const errorData = await response.json()
            console.log((errorData))
            return { ok: false, error: errorData }
        }

    } catch (error) {
        console.log('네트워크 오류', error)
        return { ok: false, error: error }
    }
}


// 인바디 수정
async function EditInbodyRecordFetch(data, recordId) {
    try {
        const response = await authFetch(`${backend_base_url}/inbody/${recordId}/`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        })

        if (response.ok) {
            const data = await response.json()
            console.log(data)
            return { ok: true, data: data }
        } else {
            const errorData = await response.json()
            console.log((errorData))
            return { ok: false, error: errorData }
        }

    } catch (error) {
        console.log('네트워크 오류', error)
        return { ok: false, error: error }
    }
}


// 단식 시작
async function createFastingRecord(data) {
    try {
        const response = await authFetch(`${backend_base_url}/fasting/`, {
            method: 'POST',
            body: JSON.stringify(data)
        })

        if (response.ok) {
            const data = await response.json()
            console.log(data)
            return { ok: true, data: data }
        } else {
            const errorData = await response.json()
            console.log((errorData))
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.log('네트워크 오류', error)
        return { ok: false, error: error }
    }
}

// 단식 디테일 불러오기
async function getFastingDetail(id) {
    try {
        const response = await authFetch(`${backend_base_url}/fasting/${id}`, {
            method: 'GET',
        })

        if (response.ok) {
            const data = await response.json()
            console.log(data)
            return { ok: true, data: data }
        } else {
            const errorData = await response.json()
            console.log((errorData))
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.log('네트워크 오류', error)
        return { ok: false, error: error }
    }
}


// 단식 수정
async function editFastingFetch(data, id) {
    try {
        const response = await authFetch(`${backend_base_url}/fasting/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        })

        if (response.ok) {
            const data = await response.json()
            console.log(data)
            return { ok: true, data: data }
        } else {
            const errorData = await response.json()
            console.log((errorData))
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.log('네트워크 오류', error)
        return { ok: false, error: error }
    }
}

// 단식 되돌리기
async function abortFastingStart(id) {
    try {
        const response = await authFetch(`${backend_base_url}/fasting/${id}/abort/`, {
            method: 'PATCH',
        })

        if (response.ok) {
            const data = await response.json()
            console.log(data)
            return { ok: true, data: data }
        } else {
            const errorData = await response.json()
            console.log((errorData))
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.log('네트워크 오류', error)
        return { ok: false, error: error }
    }
}



// 단식 기록 조회
async function getFastingRecords(from_date, to_date) {
    try {
        let apiUrl = `${backend_base_url}/fasting/`
        const params = new URLSearchParams()
        if (from_date) params.append('from_date', from_date)
        if (to_date) params.append('to_date', to_date)
        if (params.toString()) apiUrl += `?${params.toString()}`

        const response = await authFetch(apiUrl, { method: 'GET' })

        if (response.ok) {
            const data = await response.json()
            console.log(data)
            return { ok: true, data: data }
        } else {
            const errorData = await response.json()
            console.error(errorData)
            return { ok: false, error: errorData }
        }

    } catch (error) {
        console.log('네트워크 오류', error)
        return { ok: false, error: error }
    }
}


// 단식 삭제 
async function deleteFastingFetch(recordId) {
    try {
        const response = await authFetch(`${backend_base_url}/fasting/${recordId}/`, {
            method: 'DELETE'
        })

        if (response.ok) {
            return { ok: true }
        } else {
            const errorData = await response.json()
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.log('네트워크 오류', error)
        return { ok: false, error: error }
    }
}


async function getNotificationFetch() {
    try {
        const response = await authFetch(`${backend_base_url}/notifications/`, {
            method: 'GET'
        })

        if (response.ok) {
            const data = await response.json()
            return { ok: true, data: data }
        } else {
            const errorData = await response.json()
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.log('네트워크 오류', error)
        return { ok: false, error: error }
    }
}


async function NotificationMarkAsRead(notiId) {
    try {
        const response = await authFetch(`${backend_base_url}/notifications/${notiId}/read/`, {
            method: 'PATCH'
        })

        if (response.ok) {
            return { ok: true }
        } else {
            const errorData = await response.json()
            return { ok: false, error: errorData }
        }

    } catch (error) {
        console.log('네트워크 오류', error)
        return { ok: false, error: error }
    }
}


// 알람 삭제
async function DeleteNotificationFetch(notiId) {
    try {
        const response = await authFetch(`${backend_base_url}/notifications/${notiId}/`, {
            method: 'DELETE'
        })

        if (response.ok) {
            return { ok: true }
        } else {
            const errorData = await response.json()
            return { ok: false, error: errorData }
        }
    } catch (error) {
        console.log('네트워크 오류', error)
        return { ok: false, error: error }
    }
}