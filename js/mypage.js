document.addEventListener('DOMContentLoaded', function () {
    loadUserProfile()

    // 프로필 수정 폼 제출 이벤트
    document.getElementById('profile-edit-form').addEventListener('submit', handleProfileSubmit);

    // // 비밀번호 변경 폼 제출 이벤트
    // document.getElementById('password-change-form').addEventListener('submit', handlePasswordChangeSubmit);
    // document.getElementById('password-change-form').addEventListener('submit', function (event) {
    //     event.preventDefault(); // 기본 폼 제출 방지
    //     // TODO: 비밀번호 변경 API 호출
    //     console.log('비밀번호 변경 폼 제출됨');
    //     showToast('비밀번호가 변경되었습니다!', 'success');
    //     const passwordChangeModal = bootstrap.Modal.getInstance(document.getElementById('passwordChangeModal'));
    //     passwordChangeModal.hide(); // 변경 후 모달 닫기
    // });
});


// 마이페이지 기존 데이터 가져오기
async function loadUserProfile() {
    const payload = JSON.parse(localStorage.getItem('payload'))
    if (payload) {
        if (payload.is_social_login) {
            document.getElementById('password-modal').style.display = 'none'

        }
    }
    const userData = await fetchUserProfile()
    console.log(userData)

    if (userData) {
        const nicknameField = document.getElementById('mypage-nickname')
        const genderField = document.getElementById('mypage-gender')
        const birthDateField = document.getElementById('mypage-birthDate')

        if (nicknameField) nicknameField.value = userData.nickname || ''
        if (birthDateField) birthDateField.value = userData.birth_date || ''
        if (genderField) {
            let userGender = userData.gender

            if (userGender === 0) {
                genderField.value = '0'
            } else if (userGender === 1) {
                genderField.value = '1'
            } else {
                genderField.value = ''
            }

        }
    } else {
        console.log('사용자 정보 불러오기 실패')
    }
}

// 마이페이지 수정할 데이터 담기
async function handleProfileSubmit(event) {
    console.log(event)
    event.preventDefault()

    const nickname = document.getElementById('mypage-nickname').value
    const gender = document.getElementById('mypage-gender').value
    const birthDate = document.getElementById('mypage-birthDate').value

    let genderValue = null

    if (gender === '0') {
        genderValue = 0
    } else if (gender === '1') {
        genderValue = 1
    }

    let birthDateValue = null
    if (birthDate.trim() != '') {
        birthDateValue = birthDate
    }

    const userData = {
        nickname: nickname,
        gender: genderValue,
        birth_date: birthDateValue
    }

    const success = await updateProfile(userData)

    if (success) {
        showToast('프로필 정보가 수정되었습니다.', 'success')

        setTimeout(function () {
            window.location.href = 'index.html'
        }, 1000)
    } else {
        showToast('프로필 정보 수정에 실패했습니다.', 'danger')
    }

}