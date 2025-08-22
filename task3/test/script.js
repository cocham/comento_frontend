document.addEventListener('DOMContentLoaded', () => {
    const timeDisplay = document.getElementById('current-time');
    const batteryLevelDisplay = document.getElementById('battery-level');
    const alarmListDisplay = document.getElementById('alarm-list');
    const hourInput = document.getElementById('hour-input');
    const minuteInput = document.getElementById('minute-input');
    const secondInput = document.getElementById('second-input');
    const addAlarmBtn = document.getElementById('add-alarm-btn');

    let batteryLevel = 100;
    const alarms = [];
    let mainInterval;

    const padZero = (num) => String(num).padStart(2, '0');

    const renderTime = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = padZero(dateObj.getMonth() + 1);
        const day = padZero(dateObj.getDate());
        const hours = padZero(dateObj.getHours());
        const minutes = padZero(dateObj.getMinutes());
        const seconds = padZero(dateObj.getSeconds());

        return `<span class="date">${year}-${month}-${day}</span><span class="clock">${hours}:${minutes}:${seconds}</span>`;
    };

    const updateAlarmList = () => {
        alarmListDisplay.innerHTML = ''; 
        alarms.forEach((alarm, index) => {
            const alarmItem = document.createElement('div');
            alarmItem.className = 'alarm-item';
            
            const alarmText = document.createElement('span');
            alarmText.textContent = alarm;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '삭제';
            deleteBtn.className = 'delete-alarm-btn';
            deleteBtn.addEventListener('click', () => {
                alarms.splice(index, 1); 
                updateAlarmList(); 
            });
            
            alarmItem.appendChild(alarmText);
            alarmItem.appendChild(deleteBtn);
            alarmListDisplay.appendChild(alarmItem);
        });
    };

    const addAlarm = () => {
        const h = hourInput.value;
        const m = minuteInput.value;
        const s = secondInput.value;

        if (h === '' || m === '' || s === '') {
            alert('시, 분, 초를 모두 입력해주세요.');
            return;
        }

        const alarmTime = `${padZero(h)}:${padZero(m)}:${padZero(s)}`;
        if (!alarms.includes(alarmTime)) {
            alarms.push(alarmTime);
            alarms.sort();  
            updateAlarmList();
        } else {
            alert('이미 등록된 알람입니다.');
        }

        hourInput.value = '';
        minuteInput.value = '';
        secondInput.value = '';
    };
    
    const killToBatteryIcon = () => {
        timeDisplay.classList.add('dead'); 
        timeDisplay.innerHTML = `
        <svg class="battery-empty-icon blink" viewBox="0 0 64 32" role="img" aria-label="배터리 없음">
            <rect x="1" y="6" width="54" height="20" rx="3" ry="3" fill="none" stroke="#34e7e4" stroke-width="3"/>
            <rect x="56" y="12" width="7" height="8" rx="1" ry="1" fill="#34e7e4"/>
            <line x1="6" y1="26" x2="50" y2="6" stroke="#e74c3c" stroke-width="4" stroke-linecap="round"/>
        </svg>`;
        hourInput.disabled = true;
        minuteInput.disabled = true;
        secondInput.disabled = true;
        addAlarmBtn.disabled = true;
        document.querySelectorAll('.delete-alarm-btn').forEach(btn => btn.disabled = true);
    };

    const updateClock = () => {
        if (batteryLevel > 0) batteryLevel--;
        batteryLevelDisplay.textContent = batteryLevel;

        if (batteryLevel <= 0) {
            clearInterval(mainInterval);
            killToBatteryIcon();
            return;
        }

        timeDisplay.classList.remove('dead');
        const now = new Date();
        timeDisplay.innerHTML = renderTime(now);

        const hours = padZero(now.getHours());
        const minutes = padZero(now.getMinutes());
        const seconds = padZero(now.getSeconds());
        const currentTime = `${hours}:${minutes}:${seconds}`;

        if (alarms.includes(currentTime)) {
            alert(`알람! 현재 시각 ${currentTime}`);
            const alarmIndex = alarms.indexOf(currentTime);
            alarms.splice(alarmIndex, 1);
            updateAlarmList();
        }
    };

    addAlarmBtn.addEventListener('click', addAlarm);

    batteryLevelDisplay.textContent = batteryLevel;
    timeDisplay.innerHTML = renderTime(new Date());

    mainInterval = setInterval(updateClock, 1000);
});