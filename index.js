// index.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');
const path = require('path'); // <-- THÊM DÒNG NÀY

// --- CẤU HÌNH ---
const MQTT_BROKER_URL = 'mqtts://bbce32c20b324738bad8647f4e06516f.s1.eu.hivemq.cloud:8883'; // HiveMQ Cloud TLS MQTT URL
const MQTT_TOPIC = 'phongthi/yeucau'; // Topic bạn muốn subscribe
const MQTT_OPTIONS = {
    username: "T-smart",      // Thay bằng username HiveMQ Cloud
    password: "Trong2002",    // Thay bằng password HiveMQ Cloud
    reconnectPeriod: 1000     // Tự reconnect mỗi 1s nếu mất kết nối
};
const PORT = 3000;
// --------------------

const app = express();
const server = http.createServer(app);

// --- Socket.IO Server ---
const io = new Server(server, {
    cors: {
        origin: "*",
    }
});

io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client đã kết nối: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client đã ngắt kết nối: ${socket.id}`);
    });
});

// --- MQTT Client ---
console.log(`[MQTT] Đang kết nối đến ${MQTT_BROKER_URL}...`);
const mqttClient = mqtt.connect(MQTT_BROKER_URL, MQTT_OPTIONS);

mqttClient.on('connect', () => {
    console.log('[MQTT] Đã kết nối thành công!');
    mqttClient.subscribe(MQTT_TOPIC, (err) => {
        if (!err) console.log(`[MQTT] Đã đăng ký topic: "${MQTT_TOPIC}"`);
        else console.error('[MQTT] Subscribe lỗi:', err);
    });
});

mqttClient.on('message', (topic, message) => {
    const messageString = message.toString();
    console.log(`[MQTT -> Socket.IO] Nhận tin: ${messageString}`);

    // Gửi tin tới tất cả client đang kết nối
    io.emit('mqttMessage', {
        topic,
        message: messageString
    });
});

mqttClient.on('error', (error) => {
    console.error('[MQTT] Lỗi:', error);
});

// --- Express route (CẬP NHẬT) ---

// --- Express route (ĐÃ SỬA LẠI) ---

// Chỉ định thư mục 'public' là nơi chứa các file tĩnh (css, js, html)
app.use(express.static(path.join(__dirname, 'public')));

// Gửi file index.html khi truy cập trang chủ
app.get("/", (req, res) => {
    // Đường dẫn đúng là: __dirname + '/public/index.html'
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Khởi chạy HTTP server ---
// (Phần còn lại giữ nguyên)

// --- Khởi chạy HTTP server ---
server.listen(PORT, () => {
    console.log(`[HTTP] Server đang chạy tại http://localhost:${PORT}`);
});