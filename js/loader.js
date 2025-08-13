// 네비게이션 바 함수
async function injectNavbar() {
    try {
        const response = await fetch("../navbar.html")
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const navbarHtmlContent = await response.text()

        const dynamicNavbarInsertPoint = document.getElementById('dynamic-navbar-insert-point')
        if (dynamicNavbarInsertPoint) {
            dynamicNavbarInsertPoint.innerHTML = navbarHtmlContent
        } else {
            console.log("Error")
            return
        }

        // 필요한 id값 불러오기
        let nav_login = document.getElementById("nav-login")
        let nav_signup = document.getElementById("nav-signup")
        let nav_mypage = document.getElementById("nav-mypage")
        let nav_activity = document.getElementById("nav-activity")
        let nav_fasting = document.getElementById("nav-fasting")
        let nav_inbody = document.getElementById("nav-inbody")
        let nav_meal = document.getElementById("nav-meal")
        let nav_logout = document.getElementById("nav-logout-li")

        // 로그인 전 갈 수 없는 항목들 숨겨주기
        if (nav_mypage) nav_mypage.style.display = "none"
        if (nav_activity) nav_activity.style.display = "none"
        if (nav_fasting) nav_fasting.style.display = "none"
        if (nav_inbody) nav_inbody.style.display = "none"
        if (nav_meal) nav_meal.style.display = "none"

        // 이메일을 넣어주기 위해서 payload 불러오기
        let payload = localStorage.getItem("payload")

        // 로그인 후 보여주는 화면
        if (payload) {
            // 회원가입, 로그인 버튼 숨겨주기 
            if (nav_login) nav_login.style.display = "none"
            if (nav_signup) nav_signup.style.display = "none"

            // payload값에서 이메일 불러오기 쉽게 json형식으로 payload 불러오기
            let payload_parse
            console.log(payload_parse)
            try {
                payload_parse = JSON.parse(payload);
            } catch (e) {
                console.error("Error parsing payload from localStorage:", e);
                // 유효하지 않은 payload는 무시하고 로그인되지 않은 상태처럼 처리
                payload = null;
            }
            // payload에서 불러온 email값 넣어주기
            if (payload) {
                // intro.innerText = `안녕하세요! ${payload_parse.email.split('@')[0]}님 😄`

                if (nav_mypage) nav_mypage.style.display = "block"
                if (nav_activity) nav_activity.style.display = "block"
                if (nav_fasting) nav_fasting.style.display = "block"
                if (nav_inbody) nav_inbody.style.display = "block"
                if (nav_meal) nav_meal.style.display = "block"
                if (nav_logout) nav_logout.style = "block"

            }

        }
    } catch (error) {
        console.error("error in injectNavbar", error)
    }

}


function handleLogout() {
    console.log("로그아웃 버튼 클릭됨")
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('payload')

    window.location.href = "../index.html"
}


document.addEventListener('DOMContentLoaded', injectNavbar) 