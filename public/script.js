// Dữ liệu ban đầu
let classrooms = [
  { id: 1, name: 'Phòng học 1', status: 'ok', priority: null, request: '' },
  { id: 2, name: 'Phòng học 2', status: 'ok', priority: null, request: '' },
  { id: 3, name: 'Phòng học 3', status: 'ok', priority: null, request: '' },
  { id: 5, name: 'Phòng học 5', status: 'ok', priority: null, request: '' },
  { id: 7, name: 'Phòng học 7', status: 'ok', priority: null, request: '' },
  { id: 6, name: 'Phòng học 6', status: 'ok', priority: null, request: '' },
  { id: 8, name: 'Phòng học 8', status: 'ok', priority: null, request: '' },
  { id: 9, name: 'Phòng học 9', status: 'ok', priority: null, request: '' },
  { id: 10, name: 'Phòng học 10', status: 'ok', priority: null, request: '' }
];

const grid = document.getElementById('classroomGrid');
const modal = document.getElementById('supportModal');
const closeModalBtn = document.getElementById('closeModal');

// Tính toán nextPriority
let maxPriority = Math.max(...classrooms.map(r => r.priority || 0));
let nextPriority = maxPriority + 1;

// Kết nối Socket.IO
const socket = io();
socket.on('connect', () => console.log('Đã kết nối Socket.IO tới server!'));

// Nhận MQTT message
socket.on('mqttMessage', (data) => {
    try {
        const roomUpdate = JSON.parse(data.message);
        updateClassroomStatus(roomUpdate);
    } catch (e) {
        console.error('Lỗi parse JSON từ MQTT:', e, data.message);
    }
});

// Cập nhật trạng thái phòng
function updateClassroomStatus(update) {
    const room = classrooms.find(r => r.id === update.id);
    if (!room) return console.warn(`Không tìm thấy phòng với id: ${update.id}`);

    // Cập nhật status
    room.status = update.status || room.status;

    // Cập nhật request nếu có
    if (update.request) room.request = update.request;

    // Reset priority nếu status 'ok'
    if (room.status === 'ok') room.priority = null;

    // Gán priority tạm thời nếu là yêu cầu mới
    if (room.status !== 'ok' && room.priority === null) {
        room.priority = nextPriority++;
    }

    // Tái tính lại priority
    const activeRooms = classrooms.filter(r => r.status !== 'ok')
                                  .sort((a, b) => a.priority - b.priority);
    activeRooms.forEach((r, idx) => r.priority = idx + 1);
    nextPriority = activeRooms.length + 1;

    renderCards();
}

// Vẽ UI
function renderCards() {
    grid.innerHTML = '';
    const sorted = [...classrooms].sort((a,b) => (a.priority || 999) - (b.priority || 999));

    sorted.forEach(room => {
        const card = document.createElement('div');
        card.className = 'card';

        const title = document.createElement('h3');
        title.textContent = room.name;

        const status = document.createElement('div');
        status.className = 'status';
        const dot = document.createElement('span');
        const label = document.createElement('span');

        if (room.status === 'ok') {
            dot.className = 'dot ok';
            label.textContent = 'OK';
            status.append(dot, label);
        } else {
            dot.className = 'dot danger';
            const strong = document.createElement('span');
            strong.className = 'label-strong';
            strong.textContent = 'Support';
            const rest = document.createTextNode(' Requested');
            status.append(dot, strong, rest);
            card.addEventListener('click', () => openModal(room.id));
        }

        // Cột priority
        const priorityDiv = document.createElement('div');
        priorityDiv.className = 'priority';
        if (room.priority !== null) {
            const badge = document.createElement('span');
            badge.className = 'priority-badge';
            badge.textContent = `Ưu tiên ${room.priority}`;
            priorityDiv.appendChild(badge);
        } else {
            priorityDiv.textContent = 'Không ưu tiên';
            priorityDiv.classList.add('no-priority');
        }

        card.append(title, status, priorityDiv);
        grid.appendChild(card);
    });
}

// Mở modal
function openModal(roomId) {
    const room = classrooms.find(r => r.id === roomId);
    if (!room) return;

    modal.dataset.roomId = roomId;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');

    const modalText = modal.querySelector('p');
    modalText.textContent = room.request || 'Không có nội dung yêu cầu';
}

// Đóng modal
function closeModal() {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
}

closeModalBtn.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

// Xác nhận hoàn thành
document.getElementById('confirmBtn').addEventListener('click', () => {
    const roomId = parseInt(modal.dataset.roomId);
    updateClassroomStatus({ id: roomId, status: 'ok' });
    socket.emit('updateStatus', { id: roomId, status: 'ok' });
    closeModal();
});

// Chạy lần đầu
renderCards();
