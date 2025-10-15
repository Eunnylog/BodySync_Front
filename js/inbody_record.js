import { formatDateTime, formatErrorMessage } from "./utils.js"

let inbodyRecords = []
let inbodyChartInstance = null
let inbodyDetailModal
let recentInbodyRecordsBody
let noRecentRecordsMessage
let noChartDataMessage, ctx
let editBtn, deleteBtn
let startDateInput, endDateInput, filterByDateBtn, quickFilterBtns

async function handleLoadInbodyRecord(start = null, end = null) {
    const res = await getInbodyRecordsFetch(start, end)

    if (res.ok) {
        const inbodyRecords = res.data

        if (inbodyRecords.length > 0) {
            noChartDataMessage.style.display = 'none'
            const chartData = prepareChartData(inbodyRecords)
            drawChart(chartData)
            renderRecentRecords(inbodyRecords, 5)
        } else {
            window.showToast('아직 인바디 기록이 없습니다. 새로운 기록울 추가해보세요!', 'warning')
            noChartDataMessage.style.display = 'block'
            if (inbodyChartInstance) { // 이전에 인스턴스가 만들어졌다면 파괴
                inbodyChartInstance.destroy()
                inbodyChartInstance = null
            }
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height) // 캔버스 자체를 깨끗하게 지움

            renderRecentRecords(inbodyRecords, 5)
        }

    } else {
        const errorMessage = formatErrorMessage(res.error)
        window.showToast(errorMessage, 'danger')
        noChartDataMessage.style.display = 'block'
        if (inbodyChartInstance) {
            inbodyChartInstance.destroy()
            inbodyChartInstance = null
        }
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height) // 캔버스 지움
        renderRecentRecords([], 5)
    }

}

// 인바디 기록 -> 그래프 데이터 형식으로 가공
function prepareChartData(records) {
    // 날짜 순으로 정렬
    records.sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at))

    const labels = records.map(record => new Date(record.measured_at)); // 날짜/시간 객체
    const weights = records.map(record => record.weight)
    const skeletalMuscleMasses = records.map(record => record.skeletal_muscle_mass_kg)
    const bodyFatPercentages = records.map(record => record.body_fat_percentage)

    return { labels, weights, skeletalMuscleMasses, bodyFatPercentages }
}

// 그래프 그리기
function drawChart(chartData) {
    if (inbodyChartInstance) { // 이전에 그린 차트가 있으면 파괴하고 새로 그림 (갱신 시)
        inbodyChartInstance.destroy();
    }

    inbodyChartInstance = new Chart(ctx, {
        type: 'line', // 꺾은선 그래프
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: '체중 (kg)',
                    data: chartData.weights,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    yAxisID: 'y-kg' // kg 단위 Y축 지정
                },
                {
                    label: '골격근량 (kg)',
                    data: chartData.skeletalMuscleMasses,
                    borderColor: 'rgb(54, 162, 235)',
                    tension: 0.1,
                    yAxisID: 'y-kg' // kg 단위 Y축 지정
                },
                {
                    label: '체지방률 (%)',
                    data: chartData.bodyFatPercentages,
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1,
                    yAxisID: 'y-percent' // % 단위 Y축 지정
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // 컨테이너 크기에 맞춰 조절
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false,
                    text: '인바디 변화 추이'
                },
                tooltip: { // 툴팁 커스터마이징
                    callbacks: {
                        title: function (context) { // 툴팁 제목을 날짜로
                            return context[0].label;
                        },
                        label: function (context) { // 툴팁 내용
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y + (context.dataset.label.includes('(%)') ? '%' : 'kg');
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time', // 날짜/시간 축으로 설정
                    time: {
                        unit: 'day', // 하루 단위로 표시
                        tooltipFormat: 'yyyy년 MM월 dd일 HH시 mm분', // 툴팁에 표시될 날짜/시간 형식
                        displayFormats: {
                            day: 'MM/dd'
                        }
                    },
                    title: {
                        display: true,
                        text: '날짜'
                    }
                },
                'y-kg': { // kg 단위 Y축
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: '측정값 (kg)'
                    },
                    // 그리드 라인 설정
                    grid: {
                        drawOnChartArea: true,
                    }
                },
                'y-percent': { // % 단위 Y축
                    type: 'linear',
                    display: true,
                    position: 'right', // 오른쪽에 표시
                    title: {
                        display: true,
                        text: '체지방률 (%)'
                    },
                    // 'y-kg' 축과 그리드 라인을 공유하지 않도록 설정
                    grid: {
                        drawOnChartArea: false,
                    },
                    // 체지방률은 0~50% 정도로 고정
                    min: 0,
                    max: 50
                }
            },
            onClick: handleChartClick // 그래프 클릭 이벤트 핸들러
        }
    });
}

// 그래프 데이터 포인트 클릭 핸들러
function handleChartClick(event, elements) {
    if (elements.length > 0) {
        const elementIndex = elements[0].index;
        // 클릭된 데이터 포인트에 해당하는 원본 기록 찾기
        const clickedRecord = inbodyRecords[elementIndex];

        if (clickedRecord) {
            showInbodyDetailModal(clickedRecord);
        }
    }
}

// 모달에 상세 정보를 채우고 보여주기
function showInbodyDetailModal(record, recordId) {
    document.getElementById('modalMeasuredAt').innerText = record.measured_at_display;
    document.getElementById('modalHeight').innerText = `${record.height} cm`;
    document.getElementById('modalWeight').innerText = `${record.weight} kg`;
    document.getElementById('modalSkeletalMuscleMass').innerText = `${record.skeletal_muscle_mass_kg || '-'} kg`;
    document.getElementById('modalBodyFatMass').innerText = `${record.body_fat_mass_kg || '-'} kg`;
    document.getElementById('modalBodyFatPercentage').innerText = `${record.body_fat_percentage || '-'} %`;
    document.getElementById('modalBMI').innerText = `${record.bmi || '-'}`;
    document.getElementById('modalBMIStatus').innerText = record.bmi_status || '-';
    document.getElementById('edit-inbody-btn').dataset.recordId = recordId
    document.getElementById('delete-inbody-btn').dataset.recordId = recordId


    // const inbodyDetailModal = new bootstrap.Modal(document.getElementById('inbodyDetailModal'));
    inbodyDetailModal.show();
}


function renderRecentRecords(records, count = 5) { // 최근 5개 기록 표시
    recentInbodyRecordsBody.innerHTML = '' // 기존 내용 지우기

    if (records.length === 0) {
        noRecentRecordsMessage.style.display = 'block'
        return;
    } else {
        noRecentRecordsMessage.style.display = 'none'
    }

    // 날짜 최신 순으로 정렬
    const sortedRecords = [...records].sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at))
    const recentRecords = sortedRecords.slice(0, count) // 최신 N개 기록 가져오기

    recentRecords.forEach(record => {
        const row = document.createElement('tr')
        row.classList.add('inbody-record-item') // 클릭 이벤트용 클래스 추가
        row.dataset.recordId = record.id; // 나중에 필요할 경우를 대비해 ID 저장

        // 클릭 이벤트 리스너 추가: 모달 띄우기
        row.addEventListener('click', () => showInbodyDetailModal(record, record.id))

        row.innerHTML = `
            <td>${record.measured_at.split('T')[0]}</td>
            <td>${parseFloat(record.weight).toFixed(2)}</td>
            <td>${(record.skeletal_muscle_mass_kg ? parseFloat(record.skeletal_muscle_mass_kg) : '-')}</td>
            <td>${(record.body_fat_percentage ? parseFloat(record.body_fat_percentage) : '-')}</td>
            <td>${(record.bmi ? parseFloat(record.bmi).toFixed(2) : '-')} (${record.bmi_status || '-'})</td>
        `;
        recentInbodyRecordsBody.appendChild(row)
    });
}


// 인바디 삭제
async function handelDeleteInbodyRecord(recordId) {
    if (!recordId) {
        window.showToast('수정할 기록을 찾을 수 없습니다.', 'danger')
        return
    }

    const confirmed = confirm('인바디 기록을 삭제하시겠습니까?')

    if (confirmed) {
        const res = await deleteInbodyRecordFetch(recordId)

        if (res.ok) {
            window.showToast('삭제 완료', 'info')
            setTimeout(() => {
                window.location.reload()
            }, 1500)
        } else {
            const errorMessage = formatErrorMessage(res.error)
            window.showToast(errorMessage, 'danger')
        }

    }
}

// 특정 기간 계싼 후 input에 설정
function setDateRange(rangeType) {
    const today = new Date()
    let startDateForInput, startDateForFetch

    switch (rangeType) {
        case '1month':
            startDateForInput = formatDateTime(new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())).date
            startDateForFetch = startDateForInput
            break
        case '3month':
            startDateForInput = formatDateTime(new Date(today.getFullYear(), today.getMonth() - 3, today.getDate())).date
            startDateForFetch = startDateForInput
            break
        case '6month':
            startDateForInput = formatDateTime(new Date(today.getFullYear(), today.getMonth() - 6, today.getDate())).date
            startDateForFetch = startDateForInput
            break
        case 'all':
            startDateForInput = ''
            startDateForFetch = null
            break
        default:
            startDateForInput = formatDateTime(new Date(today.getFullYear(), today.getMonth(), today.getDate())).date
            startDateForFetch = startDateForInput
            break
    }

    startDateInput.value = startDateForInput
    endDateInput.value = formatDateTime(today).date
}

// 

document.addEventListener('DOMContentLoaded', async () => {
    inbodyDetailModal = new bootstrap.Modal(document.getElementById('inbodyDetailModal'))
    recentInbodyRecordsBody = document.getElementById('recentInbodyRecordsBody')
    noRecentRecordsMessage = document.getElementById('noRecentRecordsMessage')
    noChartDataMessage = document.getElementById('noChartDataMessage')
    ctx = document.getElementById('inbodyChart').getContext('2d')
    editBtn = document.getElementById('edit-inbody-btn');
    deleteBtn = document.getElementById('delete-inbody-btn')
    startDateInput = document.getElementById('startDate')
    endDateInput = document.getElementById('endDate')
    filterByDateBtn = document.getElementById('filterByDateBtn')
    quickFilterBtns = document.querySelectorAll('.quick-filter-btn')

    setDateRange('3month')
    await handleLoadInbodyRecord(startDateInput.value, endDateInput.value)

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const idToEdit = editBtn.dataset.recordId
            window.location.href = `inbody_form.html?id=${idToEdit}`
        })
    } else {
        window.showToast('수정할 기록을 찾을 수 없습니다.', 'danger')
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            const idToDelete = deleteBtn.dataset.recordId
            handelDeleteInbodyRecord(idToDelete)
        })
    }

    // 조회 버튼
    if (filterByDateBtn) {
        filterByDateBtn.addEventListener('click', async () => {
            await handelDeleteInbodyRecord(startDateInput.value, endDateInput.value)
        })
    }


    // 빠른 선택 버튼
    if (quickFilterBtns) {
        quickFilterBtns.forEach(button => {
            button.addEventListener('click', async (event) => {
                const rangeType = event.target.dataset.range
                setDateRange(rangeType)
                await handleLoadInbodyRecord(startDateInput.value, endDateInput.value)
            })
        })
    }
});