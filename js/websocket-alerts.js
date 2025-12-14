// import { FASTING_STATUS_CODES, loadFastingRecords } from './fasting-record.js'
import { formatDateTime, getPayload, formatErrorMessage } from './utils.js'

// const WEBSOCKET_URL = `ws://127.0.0.1:8000/ws/fasting-alerts/`
const WEBSOCKET_URL = `wss://api.body-sync.shop/ws/fasting-alerts/`
let fastingAlertSocket = null

let payload
let bellIcon
let notificationBadge
let notificationDropdown
let unReadNotiCount = 0

function waitForElement(selector, callback, interval = 100) {
    const element = document.querySelector(selector)
    if (element) {
        callback(element)
    } else {
        setTimeout(() => waitForElement(selector, callback, interval), interval)
    }
}

// 웹소켓 연결 시작
function connectFastingAlertWebSocket() {
    // 이미 웹소켓이 연결 되어 있거더나 연결 중이라면 다시 시도 하지 않음
    if (fastingAlertSocket &&
        (fastingAlertSocket.readyState === WebSocket.OPEN ||
            fastingAlertSocket.readyState === WebSocket.CONNECTING)) {
        return;
    }

    fastingAlertSocket = new WebSocket(WEBSOCKET_URL)

    // websocket open
    // fastingAlertSocket.onopen = (event) => {
    //     console.log('[WebSocket] 알림 서비스 연결 성공!', event)
    // }

    // 메시지 받았을 때 message
    fastingAlertSocket.onmessage = (event) => {
        const data = JSON.parse(event.data)

        if (data.type === 'fasting_start_alert') {
            window.showToast(data.message, 'info')
            unReadNotiCount++
            updateNotificationCount() // 뱃지 숫자 업데이트
        }
    }

    // 에러 났을 때 onerror
    fastingAlertSocket.onerror = (error) => {
        window.showToast('알림 서비스 연결 중 문제가 생겼어요! 재연결해볼게요!', 'danger')
        // setTimeout(connectFastingAlertWebSocket, 5000)
    }

    // 연결이 끊어졌을 때 onclose
    fastingAlertSocket.onclose = (event) => {
        window.showToast('알림 서비스 연결이 끊어졌어요!', 'warning')
        // if (event.code !== 1000) {
        //     setTimeout(connectFastingAlertWebSocket, 5000)
        // }
    }

}



// 알림 메시지 안의 단식 시작 버튼을 눌렀을 떄 작동하는 함수
async function handleStartFastingAlertClick(fastingId) {
    const confirmed = confirm('단식을 시작하겠습니까?')

    if (confirmed) {
        const now = formatDateTime(new Date())
        const fastingData = {
            'start_time': `${now.date}T${now.time}:00`,
            'status': 1,
        }

        const res = await editFastingFetch(fastingData, fastingId)

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

function updateNotificationCount() {
    if (notificationBadge) {
        if (unReadNotiCount > 0) {
            notificationBadge.textContent = unReadNotiCount
            notificationBadge.classList.remove('d-none')
        } else {
            notificationBadge.classList.add('d-none')
        }
    }

    if (bellIcon) {
        if (unReadNotiCount > 0) {
            bellIcon.classList.add('has-notifications')
        } else {
            bellIcon.classList.remove('has-notifications')
        }
    }
}


function renderNotificationList(notiData) {
    const dropdown = document.querySelector('#notificationDropdown');

    dropdown.innerHTML = ''
    unReadNotiCount = 0

    if (!notiData || notiData.length === 0) {
        dropdown.innerHTML = `<li class="dropdown-item text-muted">새 알림이 없습니다</li>`
        updateNotificationCount()
        return
    }

    notiData.forEach(noti => {
        const isRead = noti.is_read
        if (!isRead) {
            unReadNotiCount++
        }
        const notiId = noti.id
        const message = noti.message.split('님, ')[1]
        const fastingId = noti.fasting_record
        const li = document.createElement('li')
        li.classList.add('p-1')
        if (!isRead) {
            li.classList.add('bg-blue-50')
        }
        li.innerHTML = `
            <div class="notification-actions d-flex align-items-center ms-2 border rounded border-2 ${isRead ? 'border-secondary-subtle' : 'border-info'}">
                <a class="dropdown-item d-flex justify-content-between align-items-center ${!isRead ? 'fw-bold' : ''} border-gray-200 p-2" data-notification-id="${notiId}" data-action="move-page" href="/fasting_record.html">
                    <small class="text-muted">${isRead ? '✅' : '🔴'} ${message}</small>
                </a>
                <button class="btn btn-sm btn-outline-danger badge ms-2 text-danger badge-hover" data-notification-id="${notiId}" data-action="delete-notification" style="margin-right: 8px;">
                    삭제
                </button>
            </div>

        `
        dropdown.appendChild(li)
    })
    updateNotificationCount()
}


async function loadNotification() {
    const res = await getNotificationFetch()

    if (res.ok) {
        const notiData = res.data
        renderNotificationList(notiData)
    } else {
        const errorMessage = formatErrorMessage(res.data)
        window.showToast(errorMessage, 'danger')
    }
}


async function handleReadNotification(notiId) {
    if (!notiId) {
        window.showToast('알림 정보를 가져올 수 없습니다.', 'danger')
        return
    }

    const res = await NotificationMarkAsRead(notiId)

    if (!res.ok) {
        const errorMessage = formatErrorMessage(res.data)
        window.showToast(errorMessage, 'danger')
    }

}


async function handleDeleteNotification(notiId) {
    if (!notiId) {
        window.showToast('알림 정보를 가져올 수 없습니다.', 'danger')
        return
    }

    const res = await DeleteNotificationFetch(notiId)

    if (res.ok) {
        window.showToast('알림을 삭재했습니다.', 'info')
        loadNotification()
    } else {
        const errorMessage = formatErrorMessage(res.data)
        window.showToast(errorMessage, 'danger')
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    payload = getPayload()
    if (!payload) {
        return
    }
    const refreshed = await tokenRefresh();
    if (!refreshed) {
        return
    }

    waitForElement('#bellIcon', (el) => {
        bellIcon = el

        setTimeout(() => {
            notificationBadge = document.querySelector('#notificationBadge')
        }, 500)

        waitForElement('#notificationDropdown', (elDropdown) => {
            notificationDropdown = elDropdown

            document.addEventListener('click', (event) => {
                const target = event.target
                const clickAction = target.closest('[data-action]')
                if (clickAction) {
                    const action = clickAction.dataset.action
                    const notificationId = clickAction.dataset.notificationId


                    if (action === 'delete-notification') {
                        event.preventDefault()
                        if (notificationId) {
                            handleDeleteNotification(notificationId)
                        }
                    } else if (action === 'move-page') {
                        event.preventDefault()
                        if (notificationId) {
                            handleReadNotification(notificationId)
                            const href = clickAction.getAttribute('href')
                            if (href) {
                                setTimeout(() => {
                                    window.location.href = href
                                }, 200)
                            }
                        }
                    }

                }

            })
            loadNotification().then(() => {
                updateNotificationCount()
                connectFastingAlertWebSocket()
            })

        })

        // connectFastingAlertWebSocket()
        const notificationAreaLi = document.getElementById('notification-area-li');
        if (notificationAreaLi) {
            notificationAreaLi.style.display = 'block'
        }
    })
})