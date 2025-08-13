const backend_base_url = 'http://localhost:8000'
const frontend_base_url = "http://localhost:5500"



// 로그인 모달창
document.addEventListener('DOMContentLoaded', function () {
    let loginModal = document.getElementById('login-modal')

    // 모달 열 때 이벤트 (필요하면)
    loginModal.addEventListener('shown.bs.modal', function () {
    });

    // 모달 닫을 때 입력 초기화
    loginModal.addEventListener('hide.bs.modal', function () {
        document.getElementById('login-email').value = "";
        document.getElementById('login-password').value = "";
    });
})


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


// 로그아웃
async function handleLogout() {
    await fetch(`${backend_base_url}/users/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });
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