import jwt_decode from 'jwt-decode';

const backend_base_url = 'http://127.0.0.1:8000'
const frontend_base_url = "http://127.0.0.1:5500"


// 로그인 모달창 close
$(document).ready(function () {
    $('#login_modal').on('hide.bs.modal', function () {
        $('#login-email').val("");
        $('#login-password').val("");
    })
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
            body: JSON.stringify({
                'email': emailInput,
                'password': passwordInput,
            })
        })
        if (response.status == 200) {
            const response_json = await response.json()
            console.log(response_json)
            localStorage.setItem('access', response_json.access)
            const base64Url = response_json.access.split('.')[1]
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            }).join(''))

            localStorage.setItem('payload', jsonPayload)
            document.getElementById("login-modal").querySelector('[data-bs-dismiss="modal"]').click()
        }
    } catch (error) {
        console.log(error)
    }

}

// 액세스토큰 디코딩
function getDecodeAccessToken() {
    const accessToken = localStorage.getItem('access')

    if (accessToken) {
        try {
            const decodedToken = jwt_decode(accessToken)
            const currentTime = Date.now() / 1000

            if (decodedToken.exp < currentTime) {
                console.warn("액세스 토큰의 유효기간이 지났습니다.")
                return null
            }
            return decodedToken
        } catch (error) {
            console.error("디코딩 실패", error)
            localStorage.removeItem('access')
            alert('유효하지 않은 토큰입니다. 다시 로그인 해주세요.')
            window.location.href = 'index.html'
            return null
        }
    }
    return null
}

// 토큰 디코딩 정보
const userPayload = getDecodeAccessToken()

if (userPayload) {
    const payload_user_id = userPayload.user_id
    const payload_email = userPayload.email
    const payload_nickname = userPayload.nickname
    const payload_is_staff = userPayload.is_staff
    const payload_is_social_login = userPayload.is_social_login
    console.log(userPayload)
}
