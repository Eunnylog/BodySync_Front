document.addEventListener('DOMContentLoaded', function () {
    loadUserProfile()

    // 프로필 수정 폼 제출 이벤트
    document.getElementById('profile-edit-form').addEventListener('submit', handleProfileSubmit);

    // 회원탈퇴 이벤트리스너
    const deleteUserBtn = document.getElementById('delete-user')
    if (deleteUserBtn) {
        deleteUserBtn.addEventListener('click', async function () {
            const confirmMessage = confirm('정말로 회원 탈퇴를 하시겠습니까?\n모든 기록이 삭제됩니다.')
            if (confirmMessage) {
                const success = await deleteUser()
                if (success) {
                    showToast('회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.', 'success')
                    localStorage.removeItem('payload'); // 만약 저장해뒀다면 지움
                    setTimeout(function () {
                        window.location.href = 'index.html'
                    }, 1500)
                } else {
                    showToast('회원 탈퇴 중 문제가 생겼습니다.', 'danger')
                }
            }
        })
    }

    // 비밀번호 변경 모달
    const changePasswordForm = document.getElementById('password-change-form')
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const confirmMessage = confirm('비밀번호를 변경하시겠습니까?')

            if (!confirmMessage) {
                return
            }

            const current_password = document.getElementById('currentPassword').value
            const new_password = document.getElementById('newPassword').value
            const confirm_password = document.getElementById('confirmNewPassword').value

            if (!current_password || !new_password || !confirm_password) {
                showToast('모든 비밀번호 필드를 입력해주세요.', 'warning', '경고');
                return;
            }
            if (new_password !== confirm_password) {
                showToast('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.', 'danger', '오류');
                return;
            }
            if (new_password === current_password) {
                showToast('새 비밀번호는 현재 비밀번호와 같을 수 없습니다.', 'warning', '경고');
                return;
            }

            const data = {
                "pre_password": current_password,
                "new_password": new_password,
                "new_password2": confirm_password
            }

            const success = await changePassword(data)
            if (success) {
                // localStorage.removeItem('payload')
                await handleLogout()
                showToast('비밀번호 변경이 완료되었습니다. 다시 로그인해주세요.', 'success')
                setTimeout(function () {
                    window.location.href = 'index.html'
                }, 1500)
            } else {
                // api에서 로직 처리됨
            }

        })
    }
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
        }, 1500)
    } else {
        showToast('프로필 정보 수정에 실패했습니다.', 'danger')
    }

}