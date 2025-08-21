const backend_base_url = 'http://localhost:8000'
const frontend_base_url = "http://localhost:5500"
let commonToastInstance;


// 로그인 모달창
document.addEventListener('DOMContentLoaded', function () {
    const toastElement = document.getElementById('common-toast')
    let loginModal = document.getElementById('login-modal')
    let signupModal = document.getElementById('signup-modal')

    if (toastElement) {
        commonToastInstance = new bootstrap.Toast(toastElement)
    }

    // 로그인 모달 닫을 때 입력 초기화
    loginModal.addEventListener('hide.bs.modal', function () {
        document.getElementById('login-email').value = "";
        document.getElementById('login-password').value = "";
    });

    // 회원가입 모달 닫을 때 초기화
    signupModal.addEventListener('hide.bs.modal', function () {
        document.getElementById('signup-email').value = ""
        document.getElementById('signup-nickname').value = ""
        document.getElementById('signup-password').value = ""
        document.getElementById('signup-password2').value = ""
    })

    injectNavbar();

    const payload = localStorage.getItem('payload')
    const dashboardCards = document.getElementById('dashboard-cards').querySelector('.row')
    const loginRequiredMessage = document.getElementById('login-required-message')

    if (payload) {
        console.log(payload)
        dashboardCards.classList.remove('d-none')
        loginRequiredMessage.classList.add('d-none')
        loadDashboardData()
    } else {
        dashboardCards.classList.add('d-none')
        loginRequiredMessage.classList.remove('d-none')
    }
})


// Toast
function showToast(message, type = 'info', title = '알림') {
    if (!commonToastInstance) {
        console.log('Toast Error')
        return
    }

    const toastElement = commonToastInstance._element // Toast DOM 접근

    toastElement.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning', 'text-bg-info')

    if (type !== 'info') {
        toastElement.classList.add(`text-bg-${type}`)
    }

    document.getElementById('common-toast-title').innerText = title;
    document.getElementById('common-toast-body').innerText = message;

    commonToastInstance.show();
}


// 로그인
async function handleSignin(email = null, password = null) {
    let emailInput = document.getElementById("login-email").value
    let passwordInput = document.getElementById("login-password").value

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
            showToast('로그인 되었습니다!', 'success')
            const response_json = await response.json()
            localStorage.setItem('payload', JSON.stringify(response_json.payload))
            setTimeout(function () {
                window.location.href = 'index.html'
            }, 1000)

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
            showToast('회원가입이 완료되었습니다!', 'success', '환영합니다!')

            const signupModalElement = document.getElementById('signup-modal');
            const signupModalInstance = bootstrap.Modal.getInstance(signupModalElement); // Bootstrap Modal 인스턴스 가져오기
            if (signupModalInstance) {
                signupModalInstance.hide(); // 모달 숨기기 이벤트 트리거
            }

            setTimeout(function () {
                window.location.href = 'index.html'
            }, 1000)

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
    showToast('로그아웃 되었습니다!', 'success')
    localStorage.removeItem('payload'); // 만약 저장해뒀다면 지움
    setTimeout(function () {
        window.location.href = 'index.html'
    }, 1000)
}


const KAKAO_CLIENT_ID = "69ffa5c0f47c5c7084def27b4dee214b"
const KAKAO_REDIRECT_URI = "http://localhost:5500/callback_kakao.html"

const GOOGLE_CLIENT_ID = "804892791014-jesh4bfaabudi6up3b1ke554r8binvff.apps.googleusercontent.com"
const GOOGLE_REDIRECT_URI = "http://localhost:5500/callback_google.html"



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
    console.log("대시보드 데이터")

    try {
        const response = await fetch(`${backend_base_url}/users/dashboard/`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(`Failed to load dashboard data: ${errorData.detail || JSON.stringify(errorData)}`)
        }

        const dashboardData = await response.json()
        console.log('대시보드 수신 성공', dashboardData)

        // UI 업데이트
        updateDashboardCards(dashboardData)
    } catch (error) {
        console.error('대시보드 데이터 로딩 중 오류 발생', error)
    }
}


function updateDashboardCards(data) {
    // 1. 식단 요약 카드 업데이트
    const mealData = data.meal_summary
    if (mealData) {
        document.getElementById('meal-calories-display').innerText = `${parseFloat(mealData.today_calories).toFixed(0)}`
        document.getElementById('meal-carbs-display').innerHTML = `${parseFloat(mealData.today_carbs).toFixed(1)}`
        document.getElementById('meal-protein-display').innerText = `${parseFloat(mealData.today_protein).toFixed(1)}`
        document.getElementById('meal-fat-display').innerText = `${parseFloat(mealData.today_fat).toFixed(1)}`
    }

    // 2. 운동 요약 카드 업데이트
    const activityData = data.activity_summary
    if (activityData) {
        document.getElementById('activity-duration-display').innerText = `${activityData.today_duration_minutes}`
        document.getElementById('activity-calories-display').innerText = `${parseFloat(activityData.today_calories_burned).toFixed(0)}` // 소수점 버리고 정수 표시
    }

    // 3. 단식 요약 카드 업데이트
    const fastingData = data.fasting_summary
    if (fastingData.status == "진행 중") {
        document.getElementById('fast-start-btn').style.display = 'none'
        document.getElementById('fast-end-btn').style.display = 'block'
    } else {
        document.getElementById('fast-start-btn').style.display = 'block'
        document.getElementById('fast-end-btn').style.display = 'none'
    }
    if (fastingData) {
        document.getElementById('fasting-status-display').innerText = `${fastingData.status}`
        document.getElementById('fasting-duration-display').innerText = `${fastingData.duration_time}`
        document.getElementById('fasting-remaining-display').innerText = `${fastingData.remaining_time}`
    }

    const inbodyData = data.inbody_summary
    if (inbodyData) {
        document.getElementById('inbody-weight-display').innerText = `${parseFloat(inbodyData.weight).toFixed(1)}`
        document.getElementById('inbody-muscle-display').innerText = `${parseFloat(inbodyData.skeletal_muscle_mass_kg).toFixed(1)}`
        document.getElementById('inbody-fat-display').innerText = `${parseFloat(inbodyData.body_fat_percentage).toFixed(1)}`
    }
}