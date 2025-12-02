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
        let nav_intro = document.getElementById("nav-intro")
        let notificationLi = document.getElementById('notification-area-li')

        // 로그인 전 갈 수 없는 항목들 숨겨주기
        if (nav_mypage) nav_mypage.style.display = "none"
        if (nav_activity) nav_activity.style.display = "none"
        if (nav_fasting) nav_fasting.style.display = "none"
        if (nav_inbody) nav_inbody.style.display = "none"
        if (nav_meal) nav_meal.style.display = "none"
        if (nav_intro) nav_intro.style.display = "none"
        if (notificationLi) notificationLi.style.display = "none"

        // 이메일을 넣어주기 위해서 payload 불러오기
        let payload = localStorage.getItem("payload")
        let payload_parse = JSON.parse(payload)

        // 로그인 후 보여주는 화면
        if (payload) {
            // 회원가입, 로그인 버튼 숨겨주기 
            if (nav_login) nav_login.style.display = "none"
            if (nav_signup) nav_signup.style.display = "none"


            if (payload) {
                if (nav_mypage) nav_mypage.style.display = "block"
                if (nav_activity) nav_activity.style.display = "block"
                if (nav_fasting) nav_fasting.style.display = "block"
                if (nav_inbody) nav_inbody.style.display = "block"
                if (nav_meal) nav_meal.style.display = "block"
                if (nav_logout) nav_logout.style = "block"
                if (nav_intro) nav_intro.style = "block"
                if (nav_intro) nav_intro.innerText = `환영합니다! ${payload_parse.nickname}님`
                if (notificationLi) notificationLi.style.display = "block"
            }

        }
    } catch (error) {
        return error
    }

}



document.addEventListener('DOMContentLoaded', injectNavbar)